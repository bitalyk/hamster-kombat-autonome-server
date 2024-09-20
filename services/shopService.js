// Required Modules
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Constants and Configuration
const tokenPath = path.join(__dirname, '..', 'token', 'token.txt');
const token = fs.readFileSync(tokenPath, 'utf8').trim();
const urlSync = 'https://api.hamsterkombatgame.io/interlude/sync';
const urlUpgrades = 'https://api.hamsterkombatgame.io/interlude/upgrades-for-buy';
const urlBuyUpgrade = 'https://api.hamsterkombatgame.io/interlude/buy-upgrade';
const ONE_MINUTE = 60000;
const DEFAULT_WAIT_TIME = ONE_MINUTE;
const CHECK_INTERVAL = 60*15; // Interval in seconds to re-check for new upgrades
let PURCHASE_LIMIT = 1; // Default limit value; can be adjusted

// Global Variables
let isRunning = false;

// Helper Functions
function logConsoleMessage(message) {
    const now = new Date();
    const timestamp = `[${now.toTimeString().split(' ')[0]}, ${now.toLocaleDateString('en-GB').replace(/\//g, '-')}] ${message}`;
    console.log(timestamp);
    fs.appendFileSync('logs/console_logs.txt', `${timestamp}\n`);
}

async function waitFor(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function fetchData(url) {
    try {
        const response = await axios.post(url, {}, {
            headers: { 'Authorization': `Bearer ${token}` },
            timeout: 5000
        });
        return response.data;
    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            logConsoleMessage(`Request to ${url} timed out. Retrying...`);
        } else {
            logConsoleMessage(`Error fetching data from ${url}: ${error.message}`);
        }
        return null;
    }
}

async function fetchLatestData() {
    const [syncData, upgradesData] = await Promise.all([
        fetchData(urlSync),
        fetchData(urlUpgrades)
    ]);

    if (!syncData || !upgradesData) {
        logConsoleMessage('Failed to fetch the latest data.');
        return null;
    }

    return { syncData, upgradesData };
}

async function canPurchaseUpgrade(upgrade, balance) {
    if (upgrade.cooldownSeconds > 0) {
        logConsoleMessage(`Upgrade ${upgrade.name} is on cooldown for ${upgrade.cooldownSeconds} seconds.`);
        return false;
    }

    if (balance >= upgrade.price) {
        return true;
    } else {
        logConsoleMessage(`Insufficient balance for ${upgrade.name}: Needed ${upgrade.price}, Current ${balance}`);
        return false;
    }
}

async function prioritizeUpgrades(upgrades, balance, earnPassivePerSec) {
    let selectedUpgrade = null;
    let nextWaitTime = Infinity;

    // Filter out non-profitable upgrades
    const profitableUpgrades = upgrades.filter(upgrade => upgrade.profitPerHourDelta > 0);

    // Separate items below and above the purchase limit
    const belowLimitItems = profitableUpgrades.filter(upgrade => 
        (upgrade.price / upgrade.profitPerHourDelta) <= PURCHASE_LIMIT
    );

    if (belowLimitItems.length > 0) {
        // Prioritize based on time efficiency
        for (const item of belowLimitItems) {
            const waitTimeForBalance = Math.max(0, Math.ceil((item.price - balance) / earnPassivePerSec));
            const waitTimeForCooldown = item.cooldownSeconds || 0;
            const effectiveWaitTime = Math.max(waitTimeForBalance, waitTimeForCooldown);

            if (effectiveWaitTime < nextWaitTime) {
                selectedUpgrade = item;
                nextWaitTime = effectiveWaitTime;
            }
        }
    } else {
        // Consider above-limit items
        const sortedAboveLimitItems = profitableUpgrades
            .filter(upgrade => (upgrade.price / upgrade.profitPerHourDelta) > PURCHASE_LIMIT)
            .sort((a, b) => (a.price / a.profitPerHourDelta) - (b.price / b.profitPerHourDelta));

        if (sortedAboveLimitItems.length > 0) {
            selectedUpgrade = sortedAboveLimitItems[0];
            const waitTimeForBalance = Math.max(0, Math.ceil((selectedUpgrade.price - balance) / earnPassivePerSec));
            const waitTimeForCooldown = selectedUpgrade.cooldownSeconds || 0;
            nextWaitTime = Math.max(waitTimeForBalance, waitTimeForCooldown);
        }
    }

    logConsoleMessage(`Selected upgrade: ${selectedUpgrade ? selectedUpgrade.name : 'None'} with wait time: ${nextWaitTime} seconds`);
    return { selectedUpgrade, nextWaitTime };
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

        const newBalance = Math.floor(response.data.interludeUser.balanceDiamonds);
        logConsoleMessage(`Upgrade purchased successfully. New balance: ${newBalance} coins`);
        return true;
    } catch (error) {
        logConsoleMessage(`Error buying upgrade: ${error.response?.data?.error_message || error.message}`);
        return false;
    }
}

async function startShopService() {
    if (isRunning) {
        logConsoleMessage('Shop service is already running.');
        return;
    }
    isRunning = true;
    logConsoleMessage('Shop service started.');

    while (isRunning) {
        const data = await fetchLatestData();
        if (!data) {
            await waitFor(DEFAULT_WAIT_TIME / 1000);
            continue;
        }

        const { syncData, upgradesData } = data;
        const { interludeUser } = syncData;
        const balance = Math.floor(interludeUser.balanceDiamonds);
        const earnPassivePerSec = Math.round(interludeUser.earnPassivePerSec);

        logConsoleMessage(`Balance synced: ${balance} coins. Earn Passive Per Sec: ${earnPassivePerSec} coins`);

        const availableUpgrades = upgradesData.upgradesForBuy.filter(upgrade =>
            !upgrade.isExpired &&
            upgrade.isAvailable &&
            (!upgrade.maxLevel || upgrade.level <= upgrade.maxLevel)
        );

        let { selectedUpgrade, nextWaitTime } = await prioritizeUpgrades(availableUpgrades, balance, earnPassivePerSec);

        if (!selectedUpgrade) {
            logConsoleMessage('No suitable upgrades found. Waiting before retrying.');
            await waitFor(DEFAULT_WAIT_TIME / 1000);
            continue;
        }

        let retryCount = 0;
        const maxRetries = 5;
        let totalWaitTime = 0;

        while (selectedUpgrade && retryCount < maxRetries && isRunning) {
            const remainingWaitTime = nextWaitTime - totalWaitTime;
            if (remainingWaitTime <= 0) {
                break;
            }

            const waitTime = Math.min(remainingWaitTime, CHECK_INTERVAL);
            logConsoleMessage(`Waiting for ${waitTime} seconds before re-evaluating upgrades...`);
            await waitFor(waitTime);
            totalWaitTime += waitTime;

            // Re-fetch the latest data to check for new upgrades
            const latestData = await fetchLatestData();
            if (!latestData) {
                retryCount++;
                continue;
            }

            const { syncData: latestSyncData, upgradesData: latestUpgradesData } = latestData;
            const latestBalance = Math.floor(latestSyncData.interludeUser.balanceDiamonds);
            const latestEarnPassivePerSec = Math.round(latestSyncData.interludeUser.earnPassivePerSec);

            const latestAvailableUpgrades = latestUpgradesData.upgradesForBuy.filter(upgrade =>
                !upgrade.isExpired &&
                upgrade.isAvailable &&
                (!upgrade.maxLevel || upgrade.level <= upgrade.maxLevel)
            );

            // Re-prioritize upgrades
            const { selectedUpgrade: newSelectedUpgrade, nextWaitTime: newNextWaitTime } =
                await prioritizeUpgrades(latestAvailableUpgrades, latestBalance, latestEarnPassivePerSec);

            // Check if a better upgrade has become available
            if (newSelectedUpgrade && newSelectedUpgrade.id !== selectedUpgrade.id) {
                logConsoleMessage(`Found a better upgrade: ${newSelectedUpgrade.name}. Switching targets.`);
                selectedUpgrade = newSelectedUpgrade;
                nextWaitTime = newNextWaitTime;
                totalWaitTime = 0; // Reset total wait time
                continue;
            } else {
                // Update remaining wait time based on latest data
                selectedUpgrade = newSelectedUpgrade;
                nextWaitTime = newNextWaitTime;
            }

            // Check if we can now purchase the selected upgrade
            if (await canPurchaseUpgrade(selectedUpgrade, latestBalance)) {
                logConsoleMessage(`Attempting to buy ${selectedUpgrade.name} for ${selectedUpgrade.price} coins`);
                const purchaseSuccess = await buyUpgrade(selectedUpgrade.id);

                if (purchaseSuccess) {
                    // Verify purchase by fetching updated balance
                    const postPurchaseData = await fetchData(urlSync);
                    if (postPurchaseData) {
                        const newBalance = Math.floor(postPurchaseData.interludeUser.balanceDiamonds);
                        if (newBalance < latestBalance) {
                            logConsoleMessage(`Purchase of ${selectedUpgrade.name} confirmed. New balance: ${newBalance} coins.`);
                        } else {
                            logConsoleMessage(`Purchase of ${selectedUpgrade.name} failed or not reflected yet.`);
                        }
                    }
                    break; // Exit inner loop after purchase
                } else {
                    retryCount++;
                    continue; // Retry if purchase failed
                }
            } else {
                logConsoleMessage(`Cannot purchase ${selectedUpgrade.name} at this time.`);
                // Decide whether to continue waiting or re-evaluate
                if (totalWaitTime >= nextWaitTime) {
                    break; // Exit if we've waited enough
                }
            }
        }

        if (retryCount >= maxRetries) {
            logConsoleMessage(`Max retries reached for purchasing ${selectedUpgrade ? selectedUpgrade.name : 'upgrade'}. Moving on.`);
        }

        // Wait before next iteration
        await waitFor(DEFAULT_WAIT_TIME / 1000);
    }
}

function stopShopService() {
    isRunning = false;
    logConsoleMessage('Shop service stopped.');
}

function setPurchaseLimit(newLimit) {
    PURCHASE_LIMIT = newLimit;
    logConsoleMessage(`Purchase limit set to ${PURCHASE_LIMIT}`);
}

process.on('SIGINT', () => {
    stopShopService();
    logConsoleMessage('Shutting down gracefully...');
});

// Exported Functions
module.exports = {
    startShopService,
    stopShopService,
    isShopServiceRunning: () => isRunning,
    buyUpgrade,
    setPurchaseLimit
};
