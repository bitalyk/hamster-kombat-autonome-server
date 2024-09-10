const axios = require('axios');
const fs = require('fs');
const path = require('path');

const tokenPath = path.join(__dirname, '..', 'token', 'token.txt');
const token = fs.readFileSync(tokenPath, 'utf8').trim();
const urlSync = 'https://api.hamsterkombatgame.io/clicker/sync';
const urlUpgrades = 'https://api.hamsterkombatgame.io/clicker/upgrades-for-buy';
const urlBuyUpgrade = 'https://api.hamsterkombatgame.io/clicker/buy-upgrade';

let isRunning = false;
let purchaseLimit = 1; // Default limit value

function logConsoleMessage(message) {
    const now = new Date();
    const timestamp = `[${now.toTimeString().split(' ')[0]}, ${now.toLocaleDateString('en-GB').replace(/\//g, '-')}] ${message}`;
    console.log(timestamp);
    fs.appendFileSync('logs/console_logs.txt', `${timestamp}\n`);
}

async function fetchApiData(url) {
    try {
        const response = await axios.post(url, {}, {
            headers: { 'Authorization': `Bearer ${token}` },
            timeout: 5000
        });
        return response.data;
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            logConsoleMessage('Request timed out. Retrying...');
        } else {
            logConsoleMessage(`Error fetching data: ${error.message}`);
            stopShopService();
        }
        return null;
    }
}

async function prioritizeUpgrades(upgrades, balance, earnPassivePerSec) {
    let selectedUpgrade = null;
    let nextWaitTime = Infinity;

    // Filter out non-profitable upgrades
    const profitableUpgrades = upgrades.filter(upgrade => upgrade.profitPerHourDelta > 0);

    // Separate items below and above the purchase limit
    const belowLimitItems = profitableUpgrades.filter(upgrade => 
        (upgrade.price / upgrade.profitPerHourDelta) <= purchaseLimit
    );

    const aboveLimitItems = profitableUpgrades.filter(upgrade => 
        (upgrade.price / upgrade.profitPerHourDelta) > purchaseLimit
    );

    // Check below-limit items based on time efficiency
    belowLimitItems.forEach(item => {
        const waitTimeForBalance = Math.max(0, Math.ceil((item.price - balance) / earnPassivePerSec));
        const waitTimeForCooldown = item.cooldownSeconds ? item.cooldownSeconds : 0;
        const effectiveWaitTime = Math.max(waitTimeForBalance, waitTimeForCooldown);

        if (effectiveWaitTime < nextWaitTime) {
            selectedUpgrade = item;
            nextWaitTime = effectiveWaitTime;
        }
    });

    // If no viable below-limit items, consider above-limit items
    // This logic will only trigger if there are no below-limit items available at all
    if (!selectedUpgrade && belowLimitItems.length === 0) {
        aboveLimitItems.sort((a, b) => 
            (a.price / a.profitPerHourDelta) - (b.price / b.profitPerHourDelta)
        );
        
        selectedUpgrade = null;
        let lowestRatio = Infinity;
        let nextWaitTime = Infinity;
        
        aboveLimitItems.forEach(item => {
            const priceToProfitRatio = item.price / item.profitPerHourDelta;
        
            // Calculate wait times for balance and cooldown
            const waitTimeForBalance = Math.max(0, Math.ceil((item.price - balance) / earnPassivePerSec));
            const waitTimeForCooldown = item.cooldownSeconds ? item.cooldownSeconds : 0;
            const effectiveWaitTime = Math.max(waitTimeForBalance, waitTimeForCooldown);
        
            // Select the upgrade based on lowest price-to-profit ratio
            if (priceToProfitRatio < lowestRatio) {
                selectedUpgrade = item;
                lowestRatio = priceToProfitRatio;
                nextWaitTime = effectiveWaitTime; // Update the next wait time accordingly
            }
        });
    }

    logConsoleMessage(`Selected upgrade: ${selectedUpgrade ? selectedUpgrade.name : 'None'} with wait time: ${nextWaitTime} seconds`);
    return { selectedUpgrade, nextWaitTime };
}

async function startShopService() {
    if (isRunning) {
        logConsoleMessage('Shop service is already running.');
        return;
    }
    isRunning = true;
    logConsoleMessage('Shop service started.');

    while (isRunning) {
        const syncData = await fetchApiData(urlSync);
        if (!syncData) continue;

        const { clickerUser } = syncData;
        const balance = Math.floor(clickerUser.balanceCoins);
        const earnPassivePerSec = Math.round(clickerUser.earnPassivePerSec);

        logConsoleMessage(`Balance synced: ${balance} coins. Earn Passive Per Sec: ${earnPassivePerSec} coins`);

        const upgradesData = await fetchApiData(urlUpgrades);
        if (!upgradesData) continue;

        const upgrades = upgradesData.upgradesForBuy.filter(upgrade =>
            !upgrade.isExpired &&
            upgrade.isAvailable &&
            (!upgrade.maxLevel || upgrade.level <= upgrade.maxLevel)
        );

        let { selectedUpgrade, nextWaitTime } = await prioritizeUpgrades(upgrades, balance, earnPassivePerSec);

        while (selectedUpgrade) {
            logConsoleMessage(`Preparing to buy ${selectedUpgrade.name} after waiting ${nextWaitTime} seconds`);
            await new Promise(resolve => setTimeout(resolve, nextWaitTime * 1000));

            // Re-check conditions and cooldowns
            const latestBalanceData = await fetchApiData(urlSync);
            const latestUpgradeData = await fetchApiData(urlUpgrades);
            if (!latestBalanceData || !latestUpgradeData) continue;

            const latestBalance = Math.floor(latestBalanceData.clickerUser.balanceCoins);
            const currentUpgrade = latestUpgradeData.upgradesForBuy.find(upg => upg.id === selectedUpgrade.id);

            if (currentUpgrade && currentUpgrade.cooldownSeconds > 0) {
                logConsoleMessage(`Cannot buy ${selectedUpgrade.name}: still on cooldown for ${currentUpgrade.cooldownSeconds} seconds`);
                
                // If the selected upgrade was below limit and on cooldown, wait for it
                if ((selectedUpgrade.price / selectedUpgrade.profitPerHourDelta) <= purchaseLimit) {
                    logConsoleMessage(`Waiting for cooldown to expire for below-limit upgrade: ${selectedUpgrade.name}`);
                    nextWaitTime = currentUpgrade.cooldownSeconds;
                    continue; // Stay in loop waiting for cooldown to end
                }

                // If it was above limit, do not proceed
                logConsoleMessage(`Above-limit item is on cooldown, will not proceed with reprioritization.`);
                selectedUpgrade = null;
                break;
            }

            if (latestBalance >= selectedUpgrade.price) {
                logConsoleMessage(`Attempting to buy ${selectedUpgrade.name} for ${selectedUpgrade.price} coins`);
                await buyUpgrade(selectedUpgrade.id);
                break; // Exit while loop after successful purchase
            } else {
                logConsoleMessage(`Insufficient balance for ${selectedUpgrade.name}: Needed: ${selectedUpgrade.price}, Current: ${latestBalance}`);
                break; // Exit while loop if conditions aren't met
            }
        }

        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute before the next loop iteration
    }
}

function stopShopService() {
    isRunning = false;
    logConsoleMessage('Shop service stopped.');
}

async function buyUpgrade(upgradeId) {
    try {
        const timestamp = Date.now();
        const response = await axios.post(urlBuyUpgrade, { upgradeId, timestamp }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            timeout: 5000
        });

        if (response.data.error_code) {
            throw new Error(response.data.error_message);
        }

        const newBalance = Math.floor(response.data.clickerUser.balanceCoins);
        logConsoleMessage(`Upgrade purchased successfully. New balance: ${newBalance} coins`);
    } catch (error) {
        logConsoleMessage(`Error buying upgrade: ${error.response?.data?.error_message || error.message}`);
    }
}

function setPurchaseLimit(newLimit) {
    purchaseLimit = newLimit;
    logConsoleMessage(`Purchase limit set to ${purchaseLimit}`);
}

module.exports = {
    startShopService,
    stopShopService,
    isShopServiceRunning: () => isRunning,
    buyUpgrade,
    setPurchaseLimit
};