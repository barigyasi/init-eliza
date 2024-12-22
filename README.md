# 🤖 Init-Eliza: AI Agent Builder CLI

<div align="center">

![Init-Eliza Banner](https://raw.githubusercontent.com/W3bbieLabs/init-eliza/refs/heads/main/assets/banner.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-23.3.0-green.svg)](https://nodejs.org/)
[![npm version](https://img.shields.io/npm/v/init-eliza.svg)](https://www.npmjs.com/package/init-eliza)


*A powerful CLI tool for building, managing, and deploying AI agents.*

</div>

## 🌟 Features
- 🚀 **Quick Setup & Easy Management**
   - 🎮 **Multi-Agent Management**
   - 🐦 **Rapid Twitter Bot Deployment**
   - 🛠️ **Advanced Customization Options**
>
 

- 🛠️ **Easy Interface**
  - 🆕 **Create new agents**
  - ▶️ **Start existing agents**
  - 🗑️ **Remove agents**
  - 📋 **List all agents**

## 📋 Prerequisites

- Node.js v23.3.0
- pnpm package manager
- Git
- Linux/Unix environment (Tested on Ubuntu 22.04)

## 🚀 Quick Start via npm

Install via npm:

1. **Install Init-Eliza**
   ```bash
   npm i init-eliza
   ```

2. **Run Init-Eliza**
   ```bash
   npx init-eliza
   ```

## 👨🏾‍💻 Installation (Manual Installation) 

1. **Clone the Repository**
   ```bash
   git clone https://github.com/W3bbieLabs/init-eliza.git
   cd init-eliza
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start the CLI**
   ```bash
   npm start
   ```

## 💻 Usage

### Creating a New Agent

1. Select "Create Agent" from the main menu
2. Enter your agent's name when prompted
3. Select agent type:
   - Create Twitter Agent
   - Create Local Agent
4. For Twitter agents, enter credentials:
   - Username
   - Email
   - Password
5. Provide a description for your agent
   - This will be used to generate the agent's personality, style and behavior
6. The system will:
   - Clone the Eliza repository
   - Install dependencies
   - Generate character configuration
   - Set up environment variables
   - Start your agent automatically



## 🤝 Contributing

We are a small, open-source team and welcome contributions! We're particularly interested in help with:

- Adding support for AI API integrations:
  - OpenAI GPT models
  - Anthropic Claude
  - Other LLM providers
- Expanding client platform support:
  - Discord bot integration
  - Telegram bot capabilities 
  - Additional messaging platforms
- Developing agent swarm capabilities:
  - Multi-agent coordination
  - Swarm behavior patterns
  - Agent-to-agent communication
- Improving code modularity:
  - Refactoring into reusable components
  - Better separation of concerns
  - Creating well-defined interfaces
  - Implementing design patterns


If you'd like to help with any of these features or have other ideas, please feel free to contribute! We appreciate all forms of help, from code contributions to documentation improvements.

### How to Contribute

To contribute to this project, please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## Useful dev snippets

[**Eliza Direct Client**](https://github.com/elizaOS/eliza/tree/4c658d7d70433fdcb2feeffe879429eaef10685d/packages/client-direct)

**Get List of Agents**
```bash
 curl -X GET http://localhost:3000/agents
```

**Get Agent Info**
```bash
curl -X GET http://localhost:3000/agents/e0e10e6f-ff2b-0d4c-8011-1fc1eee7cb32
```

**Send message to agent**
```bash
curl -X POST http://localhost:3000/{insert_agent_name}/message -H "Content-Type: application/json" -d '{ "text": "Hello, how are you today?"}'
```





## 🙏 Acknowledgments

- Built by [W3bbie](https://w3bbie.xyz/)
- Based on [Eliza](https://github.com/ai16z/eliza) v0.1.5-alpha.5

---


</div> 