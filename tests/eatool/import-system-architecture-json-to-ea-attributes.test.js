const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..', '..');
const importerPath = path.join(repoRoot, 'eatool', 'EA-jsscript', 'import_system_architecture_json_to_ea.js');

function main() {
  importsElementAttributesAfterPersistingCoreFieldChanges();
}

function importsElementAttributesAfterPersistingCoreFieldChanges() {
  const context = loadImporterContext();
  const importPackage = new EaPackage();
  const elementMap = {};
  const elementDataMap = {
    'el-1': {
      id: 'el-1',
      name: 'Element With Attributes',
      type: 'Application Component',
      description: 'Element description',
      attributes: [
        {
          name: 'modelingSkillPaths',
          value: '.argo/skills/modeling/application-structure-viewpoint/SKILL.md',
        },
      ],
    },
  };

  const element = context.ensureElement(importPackage, 'el-1', elementDataMap, elementMap);

  assert.ok(element, 'element is created');
  assert.strictEqual(element.persistedAttributes.length, 1, 'attribute is persisted on the EA element');
  assert.strictEqual(element.persistedAttributes[0].Name, 'modelingSkillPaths');
  assert.strictEqual(
    element.persistedAttributes[0].Default,
    '.argo/skills/modeling/application-structure-viewpoint/SKILL.md',
  );
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

class EaPackage {
  constructor() {
    this.Elements = new ElementCollection();
    this.Packages = new RefreshableCollection();
    this.Diagrams = new RefreshableCollection();
  }

  Update() {}
}

class EaElement {
  constructor(name, type) {
    this._dirty = false;
    this._name = name;
    this.Type = type;
    this.ElementID = EaElement.nextId++;
    this.persistedAttributes = [];
    this.Attributes = new AttributeCollection(this);
    this.TaggedValues = new TaggedValueCollection();
    this.Elements = new ElementCollection();
    this.Methods = new RefreshableCollection();
    this.Resources = new RefreshableCollection();
    this.Issues = new RefreshableCollection();
    this.Tests = new RefreshableCollection();
    this.Diagrams = new RefreshableCollection();
  }

  get Name() {
    return this._name;
  }

  set Name(value) {
    this._name = value;
    this._dirty = true;
  }

  set Notes(value) {
    this._notes = value;
    this._dirty = true;
  }

  get Notes() {
    return this._notes;
  }

  set StereotypeEx(value) {
    this._stereotypeEx = value;
    this._dirty = true;
  }

  get StereotypeEx() {
    return this._stereotypeEx;
  }

  set Alias(value) {
    this._alias = value;
    this._dirty = true;
  }

  get Alias() {
    return this._alias;
  }

  Update() {
    this._dirty = false;
  }
}

EaElement.nextId = 1;

class ElementCollection {
  constructor() {
    this.items = [];
  }

  AddNew(name, type) {
    const element = new EaElement(name, type);
    this.items.push(element);
    return element;
  }

  Refresh() {}
}

class AttributeCollection {
  constructor(owner) {
    this.owner = owner;
  }

  AddNew(name, type) {
    const attribute = new EaAttribute(name, type);
    if (!this.owner._dirty) {
      this.owner.persistedAttributes.push(attribute);
    }
    return attribute;
  }

  Refresh() {}
}

class EaAttribute {
  constructor(name, type) {
    this.Name = name;
    this.Type = type;
  }

  Update() {}
}

class TaggedValueCollection {
  constructor() {
    this.tags = {};
  }

  AddNew(name) {
    const tag = { Name: name, Value: '', Notes: '', Update() {} };
    this.tags[name] = tag;
    return tag;
  }

  GetByName(name) {
    return this.tags[name] || null;
  }

  Refresh() {}
}

class RefreshableCollection {
  AddNew() {
    return {
      Update() {},
    };
  }

  Refresh() {}
}

main();
