const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..', '..');
const importerPath = path.join(repoRoot, 'eatool', 'EA-jsscript', 'import_system_architecture_json_to_ea.js');

function main() {
  persistsConnectorSchemaIdAfterSavingConnector();
}

function persistsConnectorSchemaIdAfterSavingConnector() {
  const context = loadImporterContext();
  const elementMap = {
    1250: new EaElement(1250),
    1251: new EaElement(1251),
  };
  const relationshipMap = {};
  const relationships = [
    {
      id: '1104',
      name: 'Triggering',
      type: 'Triggering',
      statement: '前端WEB --(Triggering)--> 后端SERVER',
      source_id: '1250',
      target_id: '1251',
      source_name: '前端WEB',
      target_name: '后端SERVER',
    },
  ];

  const count = context.importRelationships(null, relationships, elementMap, relationshipMap);

  assert.strictEqual(count, 1, 'relationship is imported');
  const connector = elementMap[1250].Connectors.items[0];
  assert.ok(connector, 'connector is created on the source element');
  assert.ok(connector._saved, 'connector is persisted before tagged values are attached');
  assert.strictEqual(connector.Alias, '1104');
  assert.strictEqual(connector.TaggedValues.GetByName('schema_id').Value, '1104', 'original schema id is preserved');
  assert.strictEqual(connector.TaggedValues.GetByName('source_name').Value, '前端WEB');
  assert.strictEqual(connector.TaggedValues.GetByName('target_name').Value, '后端SERVER');
}

function loadImporterContext() {
  const script = fs
    .readFileSync(importerPath, 'utf8')
    .replace(/^!INC .*$/gm, '')
    .replace(/\r?\nmain\(\);\s*$/, '\n');

  const context = {
    console,
    WARNED: {},
    Session: {
      Output() {},
    },
    Repository: {
      EnableUIUpdates() {},
      EnsureOutputVisible() {},
      RefreshModelView() {},
      GetProjectInterface() {
        return {
          LayoutDiagramEx() {},
        };
      },
    },
    ActiveXObject: function ActiveXObject() {
      throw new Error('ActiveXObject is not available in unit tests');
    },
  };

  vm.createContext(context);
  vm.runInContext(script, context, { filename: importerPath });
  return context;
}

class EaElement {
  constructor(elementId) {
    this.ElementID = elementId;
    this.Connectors = new ConnectorCollection();
  }
}

class ConnectorCollection {
  constructor() {
    this.items = [];
  }

  AddNew(name, type) {
    const connector = new EaConnector(name, type);
    this.items.push(connector);
    return connector;
  }

  Refresh() {}
}

class EaConnector {
  constructor(name, type) {
    this.Name = name;
    this.Type = type;
    this.SupplierID = 0;
    this.Alias = '';
    this.StereotypeEx = '';
    this.Notes = '';
    this.SequenceNo = 0;
    this.SupplierEnd = { Aggregation: 0 };
    this.ConnectorID = EaConnector.nextId++;
    this._saved = false;
    this.TaggedValues = new ConnectorTaggedValueCollection(this);
  }

  Update() {
    this._saved = true;
  }
}

EaConnector.nextId = 1000;

class ConnectorTaggedValueCollection {
  constructor(owner) {
    this.owner = owner;
    this.tags = {};
  }

  AddNew(name) {
    if (!this.owner._saved) {
      throw new Error('EA requires the connector to be saved before adding tagged values');
    }
    const tag = { Name: name, Value: '', Notes: '', Update() {} };
    this.tags[name] = tag;
    return tag;
  }

  GetByName(name) {
    return this.tags[name] || null;
  }

  Refresh() {}
}

main();
