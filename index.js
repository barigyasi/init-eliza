#!/usr/bin/env node

import chalk from 'chalk';
import inquirer from 'inquirer';
import gradient from 'gradient-string';
import chalkAnimation from 'chalk-animation';
import figlet from 'figlet';
import { createSpinner } from 'nanospinner';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { readdirSync } from 'fs';
import path from 'path';

let platform = process.platform;
let folderName;
let playerName;
let selectedProvider;
let apiKey;
let agentType;
let agentDescription;
let twitterUsername;
let twitterEmail;
let twitterPassword;


function getOperatingSystem() {
    switch (platform) {
        case 'win32':
            return 'WINDOWS';
        case 'darwin':
            return 'MACOS';
        case 'linux':
            return 'LINUX';
        default:
            return 'UNKNOWN';
    }
}

const execAsync = promisify(exec);

async function retryWithNewName() {
    console.log(chalk.yellow('\nLet\'s try with a different agent name.'));
    await askName(); // This will get a new name from the user
    await cloneElizaRepo(); // Try cloning again with the new name
}

async function cloneElizaRepo() {
    folderName = `agents/${playerName}`;

    // Add folder existence check
    if (existsSync(folderName)) {
        console.log(chalk.red(`\nFolder '${folderName}' already exists.`));
        await retryWithNewName();
        return;
    }

    const spinner = createSpinner('Cloning Eliza repository...').start();
    try {
        // Check if correct Node version is installed
        const hasCorrectVersion = await checkNodeVersion();
        if (!hasCorrectVersion) {
            // Install the correct version if not present
            await execAsync('. ~/.nvm/nvm.sh && nvm install 23.3.0');
        }

        // Use the correct version
        await execAsync('. ~/.nvm/nvm.sh && nvm use 23.3.0');
        await execAsync(`git clone -b v0.1.5-alpha.5 https://github.com/ai16z/eliza.git ${folderName}`);
        await execAsync(`cd ${folderName} && pwd && git checkout develop`);
        await execAsync(`cp src/character.ts ${folderName}/agent/src/`);
        await execAsync(`cp -r src/custom-plugins ${folderName}/agent/src/`);
        await execAsync(`cp -r src/index.ts ${folderName}/agent/src/`);
        await execAsync(`cp -r src/post.ts ${folderName}/packages/client-twitter/src/`);
        await execAsync(`cp src/.env ${folderName}/agent/`);
        //await execAsync(`. ~/.nvm/nvm.sh && nvm use 23.3.0`);

        // Check and install pnpm if needed
        await installPnpm();

        // Now run pnpm commands
        spinner.update({ text: 'Installing Eliza' });

        let { stdout1, stderr1 } = await execAsync(`cd ${folderName} && pnpm i`);
        //console.log('Output:', stdout1);
        if (stderr1) console.error('Errors:', stderr1);
        spinner.update({ text: 'Building Eliza. This may take a while... Grab a coffee ☕' });

        let { stdout2, stderr2 } = await execAsync(`cd ${folderName} && pnpm build`);
        //console.log('Output:', stdout2);
        if (stderr2) console.error('Errors:', stderr2);

        spinner.success({ text: `Successfully installed Eliza into ${folderName}` });

        let { stdout3, stderr3 } = await execAsync(`cd ${folderName} && pnpm start`);
        console.log('Output:', stdout3);
        if (stderr3) console.error('Errors:', stderr3);

    } catch (error) {
        spinner.error({ text: 'Failed to clone repository' });
        console.error(chalk.red('Error details:', error.message));
    }
}



const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));
async function showMainMenu() {
    const answers = await inquirer.prompt({
        name: 'action',
        type: 'list',
        message: 'What would you like to do?',
        choices: [
            'Create Agent',
            'Start Agent',
            'Remove Agent',
            'List Agents',
            'Exit'
        ]
    });

    switch (answers.action) {
        case 'Create Agent':
            await askName();
            await selectProvider();
            if (selectedProvider !== 'Create with Ollama (Local)') {
                await configureAPI();
            }
            await selectAgentType();
            await getTwitterCredentials();
            await getAgentDescription();
            await cloneElizaRepo();
            break;
        case 'Start Agent':
            await startExistingAgent();
            break;
        case 'Remove Agent':
            await removeAgent();
            break;
        case 'List Agents':
            await listAgents();
            break;
        case 'Exit':
            console.log(chalk.green('Thanks for using Init-Eliza!'));
            process.exit(0);
            break;
    }
}

async function removeAgent() {
    const agentsDir = 'agents';

    // Check if agents directory exists
    if (!existsSync(agentsDir)) {
        console.log(chalk.red('\nNo agents directory found.'));
        await showMainMenu();
        return;
    }

    try {
        // Get list of agent folders
        const agents = readdirSync(agentsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        if (agents.length === 0) {
            console.log(chalk.yellow('\nNo agents found to remove.'));
            await showMainMenu();
            return;
        }

        // Let user select an agent to remove
        const answer = await inquirer.prompt({
            name: 'selectedAgent',
            type: 'list',
            message: 'Select an agent to remove:',
            choices: [...agents, 'Back to Main Menu']
        });

        if (answer.selectedAgent === 'Back to Main Menu') {
            await showMainMenu();
            return;
        }

        // Confirm deletion
        const confirmation = await inquirer.prompt({
            name: 'confirm',
            type: 'confirm',
            message: chalk.red(`Are you sure you want to delete agent '${answer.selectedAgent}'? This cannot be undone.`),
            default: false
        });

        if (confirmation.confirm) {
            const spinner = createSpinner('Removing agent...').start();
            try {
                await execAsync(`rm -r agents/${answer.selectedAgent}`);
                spinner.success({ text: `Successfully removed agent: ${answer.selectedAgent}` });
                await showMainMenu();
            } catch (error) {
                spinner.error({ text: 'Failed to remove agent' });
                console.error(chalk.red('Error details:', error.message));
                await showMainMenu();
            }
        } else {
            console.log(chalk.yellow('\nAgent deletion cancelled.'));
        }

    } catch (error) {
        console.error(chalk.red('Error reading agents directory:', error.message));
        await showMainMenu();
    }
}

async function listAgents() {
    const agentsDir = 'agents';

    if (!existsSync(agentsDir)) {
        console.log(chalk.red('\nNo agents directory found.'));
        return;
    }

    try {
        // Get list of agent folders
        const agents = readdirSync(agentsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        if (agents.length === 0) {
            console.log(chalk.yellow('\nNo agents found.'));
            return;
        }

        console.log(chalk.blue('\nAvailable Agents:'));
        agents.forEach((agent, index) => {
            console.log(chalk.green(`${index + 1}. ${agent}`));
        });

        await sleep(10);

        // Prompt user for next action
        const { action } = await inquirer.prompt({
            name: 'action',
            type: 'list',
            message: 'What would you like to do next?',
            choices: [
                'Return to Main Menu',
                'Exit Program'
            ]
        });

        if (action === 'Return to Main Menu') {
            await showMainMenu();
        } else {
            console.log(chalk.green('Thanks for using Init-Eliza!'));
            process.exit(0);
        }

    } catch (error) {
        console.error(chalk.red('Error reading agents directory:', error.message));
    }
}


/*
async function welcome() {
    const rainbowTitle = chalkAnimation.rainbow(
        'Agent Builder CLI\n'
    );

    await sleep();
    rainbowTitle.stop();

    console.log(`
    ${chalk.bgBlue('WELCOME TO AGENT BUILDER')} 
    Build your own AI agents with different providers
    Configure API keys and agent types
    ${chalk.bgYellow('Let\'s get started!')}
    `);
}
*/

async function askName() {
    const answers = await inquirer.prompt({
        name: 'player_name',
        type: 'input',
        message: 'What is the name of your agent?',
        default() {
            return 'Agent1';
        },
    });

    playerName = answers.player_name;
}

async function isOllamaInstalled() {
    try {
        await execAsync('which ollama');
        return true;
    } catch (error) {
        return false;
    }
}

async function installOllama() {
    const os = getOperatingSystem();
    const spinner = createSpinner('Checking Ollama installation...').start();

    if (os !== 'LINUX') {
        spinner.error({ text: 'Ollama installation is only supported on Linux systems' });
        return;
    }

    const ollamaInstalled = await isOllamaInstalled();
    if (ollamaInstalled) {
        spinner.success({ text: 'Ollama is already installed' });
        return;
    }

    spinner.update({ text: 'Installing Ollama...' });
    try {
        await execAsync('curl -fsSL https://ollama.com/install.sh | sh');
        spinner.success({ text: 'Successfully installed Ollama' });
    } catch (error) {
        spinner.error({ text: 'Failed to install Ollama' });
        console.error(chalk.red('Error details:', error.message));
    }
}

async function selectProvider() {
    const answers = await inquirer.prompt({
        name: 'provider',
        type: 'list',
        message: 'Select an API Key provider:',
        choices: [
            'Create with Ollama (Local)',
            'Create with OPENAI API KEY',
            'Create with Anthropic API KEY',
            'Create with Google API KEY',
            'Create with Azure API KEY'
        ]
    });

    selectedProvider = answers.provider;

    if (selectedProvider === 'Create with Ollama (Local)') {
        //await installOllama();
    }
}

async function configureAPI() {
    const shouldSetAPI = await inquirer.prompt({
        name: 'setAPI',
        type: 'list',
        message: 'Would you like to configure the API key?',
        choices: ['Enter API Key', 'Skip']
    });

    if (shouldSetAPI.setAPI === 'Enter API Key') {
        const apiKeyInput = await inquirer.prompt({
            name: 'key',
            type: 'password',
            message: 'Enter your API key:',
            mask: '*'
        });
        apiKey = apiKeyInput.key;
    }
}

async function getTwitterCredentials() {
    if (agentType === 'Create Twitter Agent') {
        const twitterAnswers = await inquirer.prompt([
            {
                name: 'twitter_username',
                type: 'input',
                message: 'Enter your Twitter username:',
                validate(input) {
                    return input.length > 0 ? true : 'Username is required';
                }
            },
            {
                name: 'twitter_email',
                type: 'input',
                message: 'Enter your Twitter email:',
                validate(input) {
                    return input.length > 0 && input.includes('@') ? true : 'Please enter a valid email';
                }
            },
            {
                name: 'twitter_password',
                type: 'password',
                message: 'Enter your Twitter password:',
                mask: '*',
                validate(input) {
                    return input.length > 0 ? true : 'Password is required';
                }
            }
        ]);

        twitterUsername = twitterAnswers.twitter_username;
        twitterEmail = twitterAnswers.twitter_email;
        twitterPassword = twitterAnswers.twitter_password;
    } else if (agentType === 'Create Discord Agent' || agentType === 'Create Agent Swarm') {
        console.log(chalk.yellow('\n⚠️ This feature is currently in development and will be available soon!\n'));
        process.exit(0);
    }
}

async function selectAgentType() {
    const answers = await inquirer.prompt({
        name: 'agent',
        type: 'list',
        message: 'Select an agent type:',
        choices: [
            'Create Local Agent',
            'Create Twitter Agent',
            'Create Discord Agent',
            'Create Agent Swarm'
        ]
    });

    agentType = answers.agent;
}

async function getAgentDescription() {
    const answers = await inquirer.prompt({
        name: 'description',
        type: 'input',
        message: 'Describe your agent\'s purpose and functionality:',
        validate(input) {
            return input.length > 0 ? true : 'Please provide a description';
        }
    });

    agentDescription = answers.description;
}

function showSummary() {
    console.clear();
    figlet(`Agent Summary`, (err, data) => {
        console.log(gradient.pastel.multiline(data) + '\n');

        console.log(`
        ${chalk.blue('Agent Configuration Summary')}
        ${chalk.yellow('Agent Name:')} ${playerName}
        ${chalk.yellow('Provider:')} ${selectedProvider}
        ${chalk.yellow('API Key Status:')} ${apiKey ? 'Configured' : 'Skipped'}
        ${chalk.yellow('Agent Type:')} ${agentType}
        ${chalk.yellow('Description:')} ${agentDescription}
        ${agentType === 'Create Twitter Agent' ? `
        ${chalk.blue('Twitter Configuration')}
        ${chalk.yellow('Username:')} ${twitterUsername}
        ${chalk.yellow('Email:')} ${twitterEmail}
        ${chalk.yellow('Password:')} ${'*'.repeat(twitterPassword?.length || 0)}
        ` : ''}
        `);

        console.log(
            chalk.green(
                `🤖 Agent configuration complete! Ready to build.`
            )
        );
        process.exit(0);
    });
}

function show_title() {

    figlet(`Init-Eliza`, (err, data) => {
        console.log(gradient.pastel.multiline(data) + '\n');


        console.log(
            chalk.green(
                `Built by W3bbie\n`
            )
        );

        console.log(
            chalk.green(
                `🚧 🏗️ 👷🏾 Under Construction 🔨 🚜 \n`
            )
        );
    });
}

async function prepareNvmEnvironment() {
    const spinner = createSpinner('Checking NVM installation...').start();

    try {
        // Check if nvm is installed
        await execAsync('command -v nvm');
        spinner.success({ text: 'NVM is already installed' });
    } catch (error) {
        // NVM is not installed
        spinner.update({ text: 'Installing NVM...' });
        try {
            // Install NVM
            await execAsync('curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash');

            // Source NVM
            await execAsync('source ~/.nvm/nvm.sh');

            spinner.success({ text: 'Successfully installed NVM' });
        } catch (installError) {
            spinner.error({ text: 'Failed to install NVM' });
            console.error(chalk.red('Error details:', installError.message));
            return false;
        }
    }

    // Install Node.js LTS version
    spinner.update({ text: 'Installing Node.js LTS version...' });
    try {
        await execAsync('. ~/.nvm/nvm.sh install 23.3.0');
        await execAsync('. ~/.nvm/nvm.sh use 23.3.0');
        spinner.success({ text: 'Successfully installed Node.js LTS version' });
        return true;
    } catch (nodeError) {
        spinner.error({ text: 'Failed to install Node.js LTS version' });
        console.error(chalk.red('Error details:', nodeError.message));
        return false;
    }
}

async function startApp() {
    console.clear();
    await show_title();
    await sleep();

    // Prepare NVM environment

    await showMainMenu()
    await sleep();
    //await prepareNvmEnvironment();
    showSummary();
}

async function checkNodeVersion() {
    const spinner = createSpinner('Checking Node.js version...').start();
    try {
        // Source nvm and check if version exists
        const { stdout } = await execAsync('. ~/.nvm/nvm.sh && nvm ls | grep "v23.3.0"');

        if (stdout.includes('v23.3.0')) {
            spinner.success({ text: 'Node.js v23.3.0 is already installed' });
            return true;
        } else {
            spinner.info({ text: 'Node.js v23.3.0 is not installed' });
            return false;
        }
    } catch (error) {
        spinner.error({ text: 'Error checking Node.js version' });
        console.error(chalk.red('Error details:', error.message));
        return false;
    }
}

async function startAgent(agent_path) {
    const child = spawn('pnpm', ['start'], {
        cwd: agent_path,
        shell: true,
        stdio: 'inherit' // This will pipe the process output directly to the parent process
    });

    // Handle process exit
    return new Promise((resolve, reject) => {
        child.on('exit', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Process exited with code ${code}`));
            }
        });

        child.on('error', (err) => {
            reject(err);
        });
    });
}


async function test() {
    // Use spawn instead of exec to get real-time output
    const child = spawn('pnpm', ['start'], {
        cwd: `agents/boosie/`,
        shell: true,
        stdio: 'inherit' // This will pipe the process output directly to the parent process
    });

    // Handle process exit
    return new Promise((resolve, reject) => {
        child.on('exit', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Process exited with code ${code}`));
            }
        });

        child.on('error', (err) => {
            reject(err);
        });
    });
}

async function isPnpmInstalled() {
    try {
        await execAsync('which pnpm');
        return true;
    } catch (error) {
        return false;
    }
}

async function installPnpm() {
    const spinner = createSpinner('Checking pnpm installation...').start();
    try {
        const pnpmInstalled = await isPnpmInstalled();
        if (pnpmInstalled) {
            spinner.success({ text: 'pnpm is already installed' });
            return true;
        }

        spinner.update({ text: 'Installing pnpm...' });
        await execAsync('curl -fsSL https://get.pnpm.io/install.sh | sh -');

        // Source the updated PATH to make pnpm available
        await execAsync('source /home/ubuntu/.bashrc');

        spinner.success({ text: 'Successfully installed pnpm' });
        return true;
    } catch (error) {
        spinner.error({ text: 'Failed to install pnpm' });
        console.error(chalk.red('Error details:', error.message));
        return false;
    }
}

async function startExistingAgent() {
    const agentsDir = 'agents';
    let agents;

    // Check if agents directory exists
    if (!existsSync(agentsDir)) {
        console.log(chalk.red('\nNo agents directory found.'));
        return;
    }

    try {
        // Get list of agent folders
        agents = readdirSync(agentsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        if (agents.length === 0) {
            console.log(chalk.yellow('\nNo agents found. Create an agent first.'));
            return;
        }

        // Let user select an agent
        const answer = await inquirer.prompt({
            name: 'selectedAgent',
            type: 'list',
            message: 'Select an agent to start:',
            choices: agents
        });

        const selectedAgentPath = path.join(agentsDir, answer.selectedAgent);
        //const spinner = createSpinner(`Starting Agent: ${answer.selectedAgent}`).start();

        try {
            await startAgent(selectedAgentPath);

            // Build the agent
            /*
            spinner.update({ text: 'Building agent...' });
            await execAsync(`cd ${selectedAgentPath} && pnpm build`);

            // Start the agent
            spinner.update({ text: 'Starting agent...' });
            let { stdout3, stderr3 } = await execAsync(`cd ${selectedAgentPath} && pnpm start`);
            console.log('Output:', stdout3);
            if (stderr3) console.error('Errors:', stderr3);

            spinner.success({ text: `Successfully started agent: ${answer.selectedAgent}` });
            */
        } catch (error) {
            spinner.error({ text: 'Failed to start agent' });
            console.error(chalk.red('Error details:', error.message));
        }

        await startAgent(selectedAgentPath);

    } catch (error) {
        console.error(chalk.red('Error reading agents directory:', error.message));
    }
}



//test()

// Start the App
startApp(); 