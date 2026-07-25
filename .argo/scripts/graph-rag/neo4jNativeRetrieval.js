function createNeo4jNativeRetrieval(dependencies = {}) {
  const queryBoundary = dependencies.queryBoundary;
  if (!queryBoundary || typeof queryBoundary.query !== 'function') {
    throw new TypeError('queryBoundary.query is required');
  }

  return {
    async retrieve(request) {
      return queryBoundary.query(request);
    },
  };
}

module.exports = {
  createNeo4jNativeRetrieval,
};
