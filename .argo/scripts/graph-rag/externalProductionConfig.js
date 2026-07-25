const REQUIRED_FIELDS = [
  'neo4jUri',
  'neo4jUsername',
  'neo4jPassword',
  'embeddingCredential',
];

function resolveExternalProductionConfig(configuration, context = {}) {
  const supplied = configuration && typeof configuration === 'object'
    ? configuration
    : {};

  for (const field of REQUIRED_FIELDS) {
    const value = supplied[field];
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw blockingError(
        'EXTERNAL_CREDENTIALS_REQUIRED',
        `${field} is required for ${context.operation || 'production operation'}`,
        field,
      );
    }
  }

  return {
    neo4jUri: supplied.neo4jUri.trim(),
    neo4jUsername: supplied.neo4jUsername.trim(),
    neo4jPassword: supplied.neo4jPassword,
    embeddingCredential: supplied.embeddingCredential,
    ...(supplied.neo4jDatabase === undefined
      ? {}
      : { neo4jDatabase: supplied.neo4jDatabase }),
  };
}

function blockingError(category, message, field) {
  const error = new Error(message);
  error.category = category;
  error.field = field;
  return error;
}

module.exports = {
  resolveExternalProductionConfig,
};
