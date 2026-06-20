const validatorMcp = require('../../../scripts/validator-mcp-server.js');

if (require.main === module) {
  validatorMcp.main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = validatorMcp;
