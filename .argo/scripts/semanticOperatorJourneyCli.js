const path = require('node:path');

async function runSemanticOperatorCommand({ command, options = {}, journey }) {
  if (!journey) {
    throw new TypeError('journey is required');
  }
  if (command === 'init') return journey.startNewProject(options);
  if (command === 'backfill') return journey.runExplicitBackfill(options);
  if (command === 'readiness') return journey.verifyReadiness(options);
  if (command === 'query') return journey.query(options);
  if (command === 'snapshot') return journey.readFullSnapshot();
  throw new Error(`Unknown semantic operator command: ${command}`);
}

async function main(argv = process.argv.slice(2)) {
  const command = argv[0];
  const parsedOptions = parseOptions(argv.slice(1));
  const repositoryRoot = process.env.ARGO_REPO_ROOT
    || process.env.WORKSPACE_FOLDER
    || path.resolve(__dirname, '..', '..');
  const options = {
    ...parsedOptions,
    approvedConfigurationRequest: {
      repositoryRoot,
      useCase: 'production-semantic-query',
    },
  };
  const {
    createDefaultProductionSemanticOperatorJourney,
  } = require('./systemarchitecture-mcp-server.js');
  const journey = await createDefaultProductionSemanticOperatorJourney();
  const result = await runSemanticOperatorCommand({ command, options, journey });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

function parseOptions(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--automatic-backfill') options.automaticBackfillOptIn = true;
    else if (argument === '--explicit-opt-in') options.explicitOptIn = true;
    else if (argument === '--resume') options.resume = true;
    else if (argument === '--request-json') {
      index += 1;
      return JSON.parse(args[index]);
    }
  }
  return options;
}

if (require.main === module) {
  main().catch(error => {
    console.error(error && error.stack ? error.stack : error);
    process.exit(1);
  });
}

module.exports = {
  runSemanticOperatorCommand,
};
