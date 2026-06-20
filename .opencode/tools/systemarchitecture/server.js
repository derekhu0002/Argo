const systemArchitectureMcp = require('../../../scripts/systemarchitecture-mcp-server.js');

if (require.main === module) {
  systemArchitectureMcp.main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = systemArchitectureMcp;
