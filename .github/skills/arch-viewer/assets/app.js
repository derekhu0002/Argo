'use strict';

(function () {
  const state = {
    schema: null,
    data: null,
    search: '',
    selectedPath: 'root',
    expandedPaths: new Set(['root']),
    validationErrors: [],
  };

  const app = document.getElementById('app');

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function humanize(key) {
    return String(key).replace(/_/g, ' ').replace(/\b\w/g, function (match) {
      return match.toUpperCase();
    });
  }

  function pathKey(parts) {
    return parts.join('/');
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  function resolveSchema(schema) {
    if (!schema) {
      return {};
    }
    if (!schema.$ref) {
      return schema;
    }
    if (!state.schema || !schema.$ref.startsWith('#/')) {
      return schema;
    }
    const parts = schema.$ref.slice(2).split('/');
    let current = state.schema;
    for (const part of parts) {
      current = current ? current[part] : null;
    }
    return current || schema;
  }

  function inferSchema(schema, value) {
    const resolved = resolveSchema(schema);
    if (resolved && resolved.type) {
      return resolved;
    }
    if (Array.isArray(value)) {
      return Object.assign({}, resolved, { type: 'array' });
    }
    if (isPlainObject(value)) {
      return Object.assign({}, resolved, { type: 'object' });
    }
    return Object.assign({}, resolved, { type: typeof value });
  }

  function getValueType(value, schema) {
    const resolved = inferSchema(schema, value);
    if (resolved.type) {
      return resolved.type;
    }
    if (Array.isArray(value)) {
      return 'array';
    }
    if (isPlainObject(value)) {
      return 'object';
    }
    if (value === null) {
      return 'null';
    }
    return typeof value;
  }

  function getObjectEntries(value, schema) {
    const resolved = inferSchema(schema, value);
    const keys = new Set();
    const ordered = [];
    const properties = resolved.properties || {};

    Object.keys(properties).forEach(function (key) {
      keys.add(key);
      ordered.push(key);
    });
    Object.keys(value || {}).forEach(function (key) {
      if (!keys.has(key)) {
        ordered.push(key);
      }
    });

    return ordered
      .filter(function (key) {
        return value && value[key] !== undefined;
      })
      .map(function (key) {
        return {
          key: key,
          value: value[key],
          schema: properties[key] || {},
          required: Array.isArray(resolved.required) && resolved.required.indexOf(key) >= 0,
        };
      });
  }

  function getArrayItemSchema(schema, itemValue) {
    const resolved = inferSchema(schema, []);
    if (resolved.items) {
      return resolveSchema(resolved.items);
    }
    if (isPlainObject(itemValue)) {
      return { type: 'object' };
    }
    return {};
  }

  function getNodeTitle(key, value, schema, isRoot) {
    if (isRoot) {
      return value && value.name ? value.name : 'SystemArchitecture.json';
    }
    if (Array.isArray(value)) {
      return humanize(key);
    }
    if (isPlainObject(value)) {
      const candidateKeys = ['name', 'title', 'view_name', 'statement', 'id', 'view_id', 'type'];
      for (const candidate of candidateKeys) {
        if (typeof value[candidate] === 'string' && value[candidate].trim()) {
          return value[candidate];
        }
        if (typeof value[candidate] === 'number') {
          return String(value[candidate]);
        }
      }
      const resolved = inferSchema(schema, value);
      const firstProperty = Object.keys(resolved.properties || {}).find(function (propertyKey) {
        return typeof value[propertyKey] === 'string' && value[propertyKey].trim();
      });
      if (firstProperty) {
        return value[firstProperty];
      }
    }
    if (value === null) {
      return humanize(key);
    }
    if (typeof value === 'string' && value.trim()) {
      return value.length > 42 ? value.slice(0, 39) + '...' : value;
    }
    return humanize(key);
  }

  function getNodeSummary(value, schema) {
    const type = getValueType(value, schema);
    if (type === 'array') {
      const count = Array.isArray(value) ? value.length : 0;
      return count + ' item' + (count === 1 ? '' : 's');
    }
    if (type === 'object') {
      const size = Object.keys(value || {}).length;
      return size + ' field' + (size === 1 ? '' : 's');
    }
    if (type === 'string') {
      return value.length > 160 ? value.slice(0, 157) + '...' : value;
    }
    if (value === null || value === undefined || value === '') {
      return 'No value';
    }
    return String(value);
  }

  function getTypePills(schema, value, required) {
    const resolved = inferSchema(schema, value);
    const pills = [];
    pills.push('<span class="type-pill">' + escapeHtml(resolved.type || getValueType(value, schema)) + '</span>');
    if (required) {
      pills.push('<span class="required-pill">Required</span>');
    }
    if (Array.isArray(resolved.enum)) {
      pills.push('<span class="enum-pill">' + resolved.enum.length + ' enum option' + (resolved.enum.length === 1 ? '' : 's') + '</span>');
    }
    if (Array.isArray(value)) {
      pills.push('<span class="count-badge">' + value.length + ' item' + (value.length === 1 ? '' : 's') + '</span>');
    }
    if (isPlainObject(value)) {
      pills.push('<span class="summary-pill">' + Object.keys(value).length + ' field' + (Object.keys(value).length === 1 ? '' : 's') + '</span>');
    }
    return pills.join('');
  }

  function formatValue(value) {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value, null, 2);
  }

  function countTopLevelSections(schema, data) {
    return Object.keys((schema && schema.properties) || {}).map(function (key) {
      const propertySchema = resolveSchema(schema.properties[key]);
      const value = data ? data[key] : undefined;
      const count = Array.isArray(value) ? value.length : isPlainObject(value) ? Object.keys(value).length : (value !== undefined && value !== null && value !== '' ? 1 : 0);
      return {
        key: key,
        count: count,
        type: propertySchema.type || getValueType(value, propertySchema),
        description: propertySchema.description || '',
      };
    });
  }

  function validateAgainstSchema(value, schema, path, errors) {
    const resolved = inferSchema(schema, value);
    const type = resolved.type;

    if (type === 'object') {
      if (!isPlainObject(value)) {
        errors.push(path + ' should be an object');
        return;
      }
      const required = resolved.required || [];
      required.forEach(function (requiredKey) {
        if (value[requiredKey] === undefined) {
          errors.push(path + '.' + requiredKey + ' is required');
        }
      });
      if (resolved.additionalProperties === false && resolved.properties) {
        Object.keys(value).forEach(function (key) {
          if (!Object.prototype.hasOwnProperty.call(resolved.properties, key)) {
            errors.push(path + '.' + key + ' is not allowed by the schema');
          }
        });
      }
      getObjectEntries(value, resolved).forEach(function (entry) {
        validateAgainstSchema(entry.value, entry.schema, path + '.' + entry.key, errors);
      });
      return;
    }

    if (type === 'array') {
      if (!Array.isArray(value)) {
        errors.push(path + ' should be an array');
        return;
      }
      value.forEach(function (item, index) {
        validateAgainstSchema(item, getArrayItemSchema(resolved, item), path + '[' + index + ']', errors);
      });
      return;
    }

    if (type === 'string' && typeof value !== 'string') {
      errors.push(path + ' should be a string');
    }
    if (type === 'number' && typeof value !== 'number') {
      errors.push(path + ' should be a number');
    }
    if (type === 'integer' && (!Number.isInteger(value))) {
      errors.push(path + ' should be an integer');
    }
    if (type === 'boolean' && typeof value !== 'boolean') {
      errors.push(path + ' should be a boolean');
    }
    if (Array.isArray(resolved.enum) && resolved.enum.indexOf(value) < 0) {
      errors.push(path + ' should be one of [' + resolved.enum.join(', ') + ']');
    }
  }

  function buildNode(pathParts, key, value, schema, required, isRoot) {
    const path = pathKey(pathParts);
    const resolved = inferSchema(schema, value);
    const type = getValueType(value, resolved);
    const children = [];

    if (type === 'object' && isPlainObject(value)) {
      getObjectEntries(value, resolved).forEach(function (entry) {
        children.push(buildNode(pathParts.concat(entry.key), entry.key, entry.value, entry.schema, entry.required, false));
      });
    } else if (type === 'array' && Array.isArray(value)) {
      value.forEach(function (item, index) {
        children.push(buildNode(pathParts.concat(String(index)), String(index), item, getArrayItemSchema(resolved, item), false, false));
      });
    }

    return {
      path: path,
      key: key,
      title: getNodeTitle(key, value, resolved, isRoot),
      summary: getNodeSummary(value, resolved),
      type: type,
      value: value,
      schema: resolved,
      required: required,
      children: children,
      isRoot: isRoot,
    };
  }

  function queryMatchesNode(node, query) {
    if (!query) {
      return true;
    }
    const haystacks = [
      node.title,
      node.key,
      node.summary,
      node.schema && node.schema.description,
      typeof node.value === 'string' ? node.value : '',
      typeof node.value === 'number' ? String(node.value) : '',
      typeof node.value === 'boolean' ? String(node.value) : '',
    ].filter(Boolean).join(' ').toLowerCase();

    if (haystacks.indexOf(query) >= 0) {
      return true;
    }
    return node.children.some(function (child) {
      return queryMatchesNode(child, query);
    });
  }

  function nodeHasDirectMatch(node, query) {
    if (!query) {
      return false;
    }
    const haystacks = [
      node.title,
      node.key,
      node.summary,
      node.schema && node.schema.description,
      typeof node.value === 'string' ? node.value : '',
    ].filter(Boolean).join(' ').toLowerCase();
    return haystacks.indexOf(query) >= 0;
  }

  function findNode(node, targetPath) {
    if (node.path === targetPath) {
      return node;
    }
    for (const child of node.children) {
      const result = findNode(child, targetPath);
      if (result) {
        return result;
      }
    }
    return null;
  }

  function countVisibleNodes(node, query) {
    if (!query) {
      return countAllNodes(node);
    }
    if (!queryMatchesNode(node, query)) {
      return 0;
    }
    return 1 + node.children.reduce(function (sum, child) {
      return sum + countVisibleNodes(child, query);
    }, 0);
  }

  function countAllNodes(node) {
    return 1 + node.children.reduce(function (sum, child) {
      return sum + countAllNodes(child);
    }, 0);
  }

  function renderOutline(sections) {
    return sections.map(function (section) {
      const path = 'root/' + section.key;
      const isActive = state.selectedPath === path;
      return '' +
        '<button class="outline-item' + (isActive ? ' active' : '') + '" data-action="select" data-path="' + escapeHtml(path) + '">' +
          '<span class="outline-meta">' +
            '<span class="outline-name">' + escapeHtml(humanize(section.key)) + '</span>' +
            '<span class="outline-desc">' + escapeHtml(section.description || 'Schema-defined section') + '</span>' +
          '</span>' +
          '<span class="count-badge">' + escapeHtml(section.type) + ' · ' + escapeHtml(section.count) + '</span>' +
        '</button>';
    }).join('');
  }

  function renderNode(node, depth, query) {
    if (query && !queryMatchesNode(node, query)) {
      return '';
    }

    const isSelected = state.selectedPath === node.path;
    const directMatch = nodeHasDirectMatch(node, query);
    const isExpandable = node.children.length > 0;
    const isExpanded = isExpandable && (state.expandedPaths.has(node.path) || (query && node.children.some(function (child) {
      return queryMatchesNode(child, query);
    })));

    const preview = (node.type === 'object' || node.type === 'array')
      ? ''
      : '<div class="value-preview">' + escapeHtml(formatValue(node.value)) + '</div>';

    const controls = isExpandable
      ? '<div class="node-controls"><button class="node-toggle" data-action="toggle" data-path="' + escapeHtml(node.path) + '">' + (isExpanded ? 'Collapse' : 'Expand') + ' branch</button></div>'
      : '';

    const children = isExpandable && isExpanded
      ? '<div class="node-children"><div class="children-grid">' + node.children.map(function (child) {
          return '<div class="tree-branch">' + renderNode(child, depth + 1, query) + '</div>';
        }).join('') + '</div></div>'
      : '';

    return '' +
      '<div class="tree-node">' +
        '<button class="node-card' + (isSelected ? ' selected' : '') + (directMatch ? ' match' : '') + '" data-action="select" data-path="' + escapeHtml(node.path) + '">' +
          '<div class="node-head">' +
            '<div class="node-title-wrap">' +
              '<div class="node-kicker">' + escapeHtml(node.isRoot ? 'Document root' : humanize(node.key)) + '</div>' +
              '<h3 class="node-title">' + escapeHtml(node.title) + '</h3>' +
            '</div>' +
          '</div>' +
          '<div class="node-summary">' + escapeHtml(node.summary || 'No summary available') + '</div>' +
          '<div class="node-meta">' + getTypePills(node.schema, node.value, node.required) + '</div>' +
          preview +
        '</button>' +
        controls +
        children +
      '</div>';
  }

  function renderInspector(node) {
    if (!node) {
      return '' +
        '<div class="inspector-card">' +
          '<h3>No node selected</h3>' +
          '<div class="inspector-subtitle">Pick a branch from the layered tree to inspect its schema shape and raw value.</div>' +
        '</div>';
    }

    const resolved = inferSchema(node.schema, node.value);
    const description = resolved.description || (node.isRoot ? 'Schema-driven root summary.' : 'Schema-defined node.');
    const entries = isPlainObject(node.value)
      ? getObjectEntries(node.value, resolved).map(function (entry) {
          return '' +
            '<div class="field-card">' +
              '<div class="field-name">' + escapeHtml(humanize(entry.key)) + '</div>' +
              '<div class="field-badges">' + getTypePills(entry.schema, entry.value, entry.required) + '</div>' +
              '<div class="field-preview">' + escapeHtml(getNodeSummary(entry.value, entry.schema)) + '</div>' +
            '</div>';
        }).join('')
      : '';

    return '' +
      '<div class="inspector-card">' +
        '<h3>' + escapeHtml(node.title) + '</h3>' +
        '<div class="inspector-subtitle">' + escapeHtml(description) + '</div>' +
        '<div class="inspector-meta">' + getTypePills(resolved, node.value, node.required) + '<span class="summary-pill">' + escapeHtml(node.path) + '</span></div>' +
        '<div class="inspector-raw"><pre class="mono-box">' + escapeHtml(formatValue(node.value)) + '</pre></div>' +
      '</div>' +
      (entries
        ? '<div class="inspector-card"><h3>Immediate fields</h3><div class="field-grid">' + entries + '</div></div>'
        : '') +
      (Array.isArray(node.value)
        ? '<div class="inspector-card"><h3>Array shape</h3><div class="inspector-subtitle">Items inherit their visuals from the schema item definition and stay collapsed until opened from the tree.</div></div>'
        : '');
  }

  function renderValidation(errors) {
    if (!errors.length) {
      return '' +
        '<div class="validation-card">' +
          '<h3>Validation</h3>' +
          '<div class="ok-item">Schema-required fields and simple type checks passed.</div>' +
        '</div>';
    }
    return '' +
      '<div class="validation-card">' +
        '<h3>Validation issues</h3>' +
        '<div class="error-list">' + errors.slice(0, 20).map(function (error) {
          return '<div class="error-item">' + escapeHtml(error) + '</div>';
        }).join('') + '</div>' +
        (errors.length > 20 ? '<div class="muted" style="margin-top:10px">Showing first 20 of ' + errors.length + ' issues.</div>' : '') +
      '</div>';
  }

  function getCrumbs(path) {
    return path.split('/').map(function (part, index, parts) {
      if (index === 0) {
        return 'Root';
      }
      return /^[0-9]+$/.test(part) ? 'Item ' + part : humanize(part);
    });
  }

  function ensureSelection(rootNode) {
    if (findNode(rootNode, state.selectedPath)) {
      return;
    }
    state.selectedPath = 'root';
  }

  function renderApp() {
    if (!state.schema || !state.data) {
      return;
    }

    const rootNode = buildNode(['root'], 'root', state.data, state.schema, true, true);
    ensureSelection(rootNode);
    const selectedNode = findNode(rootNode, state.selectedPath);
    const sections = countTopLevelSections(state.schema, state.data);
    const query = state.search.trim().toLowerCase();
    const visibleNodes = countVisibleNodes(rootNode, query);
    const totalNodes = countAllNodes(rootNode);
    const errorCount = state.validationErrors.length;
    const crumbs = getCrumbs(state.selectedPath);

    app.innerHTML = '' +
      '<div class="shell">' +
        '<div class="app-frame">' +
          '<section class="hero">' +
            '<div class="panel hero-main">' +
              '<div class="eyebrow"><span class="eyebrow-dot"></span>Schema-driven layered explorer</div>' +
              '<h1 class="hero-title">' + escapeHtml(state.data.name || 'Architecture Viewer') + '</h1>' +
              '<p class="hero-copy">' + escapeHtml(state.data.description || 'A React-style hierarchical explorer generated from the JSON schema. Expand only the branches you need, inspect structure on the right, and keep the view generic to the schema instead of any one document.') + '</p>' +
              '<div class="hero-actions">' +
                '<button class="primary-btn" data-action="expand-top">Expand top level</button>' +
                '<button class="secondary-btn" data-action="collapse-all">Collapse all</button>' +
                '<button class="ghost-btn" data-action="reload">Reload data</button>' +
              '</div>' +
            '</div>' +
            '<div class="panel hero-side">' +
              '<div class="status-card">' +
                '<div class="status-head">' +
                  '<p class="status-title">Schema health</p>' +
                  '<span class="status-pill ' + (errorCount ? 'invalid' : 'valid') + '">' + (errorCount ? errorCount + ' issue' + (errorCount === 1 ? '' : 's') : 'Valid') + '</span>' +
                '</div>' +
              '</div>' +
              '<div class="stat-grid">' +
                '<div class="stat-card"><strong>' + sections.length + '</strong><span>Top-level sections</span></div>' +
                '<div class="stat-card"><strong>' + totalNodes + '</strong><span>Total nodes</span></div>' +
                '<div class="stat-card"><strong>' + visibleNodes + '</strong><span>Visible with current filter</span></div>' +
                '<div class="stat-card"><strong>' + crumbs.length + '</strong><span>Current depth</span></div>' +
              '</div>' +
            '</div>' +
          '</section>' +
          '<section class="toolbar">' +
            '<div class="panel search-panel">' +
              '<p class="search-label">Search</p>' +
              '<div class="search-wrap">' +
                '<span class="search-icon">⌕</span>' +
                '<input class="search-input" id="search-input" type="search" value="' + escapeHtml(state.search) + '" placeholder="Search labels, values, schema descriptions">' +
              '</div>' +
              '<div class="search-meta">' + (query ? 'Matched branches stay auto-expanded while filtering.' : 'Search expands matching branches on demand.') + '</div>' +
            '</div>' +
            '<div class="panel crumb-panel">' +
              '<p class="crumb-label">Current path</p>' +
              '<div class="crumbs">' + crumbs.map(function (crumb) {
                return '<span class="crumb">' + escapeHtml(crumb) + '</span>';
              }).join('') + '</div>' +
            '</div>' +
          '</section>' +
          '<section class="workspace">' +
            '<aside class="panel outline-panel">' +
              '<p class="outline-title">Sections</p>' +
              '<div class="outline-scroll">' + renderOutline(sections) + '</div>' +
            '</aside>' +
            '<main class="panel tree-panel">' +
              '<p class="tree-title">Layered tree</p>' +
              '<div class="tree-scroll">' +
                (visibleNodes
                  ? '<div class="tree-root">' + renderNode(rootNode, 0, query) + '</div>'
                  : '<div class="tree-empty">No branches match the current search.</div>') +
              '</div>' +
            '</main>' +
            '<aside class="panel inspector-panel">' +
              '<p class="inspector-title">Inspector</p>' +
              '<div class="inspector-scroll">' +
                renderInspector(selectedNode) +
                renderValidation(state.validationErrors) +
              '</div>' +
            '</aside>' +
          '</section>' +
        '</div>' +
      '</div>';

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.focus({ preventScroll: true });
      searchInput.setSelectionRange(state.search.length, state.search.length);
    }
  }

  function expandTopLevel() {
    const next = new Set(['root']);
    const properties = (state.schema && state.schema.properties) || {};
    Object.keys(properties).forEach(function (key) {
      next.add('root/' + key);
    });
    state.expandedPaths = next;
  }

  function collapseAll() {
    state.expandedPaths = new Set(['root']);
  }

  function selectPath(path) {
    state.selectedPath = path;
    const parts = path.split('/');
    const next = new Set(state.expandedPaths);
    for (let index = 1; index <= parts.length; index += 1) {
      next.add(parts.slice(0, index).join('/'));
    }
    state.expandedPaths = next;
  }

  function togglePath(path) {
    const next = new Set(state.expandedPaths);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    state.expandedPaths = next;
  }

  async function load() {
    app.innerHTML = '' +
      '<div class="boot-screen">' +
        '<div class="boot-logo">KG</div>' +
        '<h1>Architecture Viewer</h1>' +
        '<p>Loading schema and document...</p>' +
      '</div>';

    try {
      const responses = await Promise.all([
        fetch('/api/schema'),
        fetch('/api/data'),
      ]);

      responses.forEach(function (response) {
        if (!response.ok) {
          throw new Error('Failed to load viewer assets');
        }
      });

      state.schema = await responses[0].json();
      state.data = await responses[1].json();
      const errors = [];
      validateAgainstSchema(state.data, state.schema, 'root', errors);
      state.validationErrors = errors;
      renderApp();
    } catch (error) {
      app.innerHTML = '' +
        '<div class="shell">' +
          '<div class="panel" style="padding:24px; max-width:720px; margin:48px auto;">' +
            '<h1 style="margin-top:0;">Failed to load viewer</h1>' +
            '<p class="muted">' + escapeHtml(error instanceof Error ? error.message : String(error)) + '</p>' +
          '</div>' +
        '</div>';
    }
  }

  app.addEventListener('click', function (event) {
    const target = event.target.closest('[data-action]');
    if (!target) {
      return;
    }

    const action = target.getAttribute('data-action');
    const path = target.getAttribute('data-path');

    if (action === 'reload') {
      load();
      return;
    }
    if (action === 'expand-top') {
      expandTopLevel();
      renderApp();
      return;
    }
    if (action === 'collapse-all') {
      collapseAll();
      renderApp();
      return;
    }
    if (action === 'toggle' && path) {
      togglePath(path);
      renderApp();
      return;
    }
    if (action === 'select' && path) {
      selectPath(path);
      renderApp();
    }
  });

  app.addEventListener('input', function (event) {
    if (event.target && event.target.id === 'search-input') {
      state.search = event.target.value;
      renderApp();
    }
  });

  load();
})();
