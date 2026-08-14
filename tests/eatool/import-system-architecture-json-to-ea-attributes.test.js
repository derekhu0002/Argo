const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..', '..');
const importerPath = path.join(repoRoot, 'eatool', 'EA-jsscript', 'import_system_architecture_json_to_ea.js');

function main() {
  importsElementAttributesAfterPersistingCoreFieldChanges();
  importsElementAttributeValuesAsNotes();
  importsElementAttributeDescriptionsAsNotes();
  importsElementAttributeContentAsNotes();
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
  assert.strictEqual(element.persistedAttributes[0].Notes, '', 'value is not written to EA Notes');
  assert.deepStrictEqual(element.persistedAttributes[0].TaggedValues.tags, {}, 'value is not written to tagged values');
}

function importsElementAttributeValuesAsNotes() {
  const context = loadImporterContext();
  const importPackage = new EaPackage();
  const elementMap = {};
  const longValue = [
    '.argo/skills/modeling/requirements-realization-viewpoint/SKILL.md',
    '.argo/skills/modeling/application-usage-viewpoint/SKILL.md',
    '.argo/skills/modeling/application-structure-viewpoint/SKILL.md',
    '.argo/skills/modeling/application-cooperation-viewpoint/SKILL.md',
    '.argo/skills/modeling/information-structure-viewpoint/SKILL.md',
    '.argo/skills/modeling/technology-usage-viewpoint/SKILL.md',
    '.argo/skills/modeling/technology-viewpoint/SKILL.md',
    '.argo/skills/modeling/implementation-deployment-viewpoint/SKILL.md',
  ].join('; ');
  const elementDataMap = {
    'el-long': {
      id: 'el-long',
      name: 'Element With Long Attribute',
      type: 'Grouping',
      attributes: [
        {
          name: 'modelingSkillPaths',
          value: longValue,
        },
      ],
    },
  };

  const element = context.ensureElement(importPackage, 'el-long', elementDataMap, elementMap);

  assert.ok(element, 'element is created');
  assert.strictEqual(element.persistedAttributes.length, 1, 'attribute is persisted on the EA element');
  assert.strictEqual(element.persistedAttributes[0].Notes, longValue, 'long value is written to EA Notes');
  assert.strictEqual(element.persistedAttributes[0].Default, '', 'long value is not written to EA Default');
  assert.deepStrictEqual(element.persistedAttributes[0].TaggedValues.tags, {}, 'long value is not written to tagged values');
}

function importsElementAttributeDescriptionsAsNotes() {
  const context = loadImporterContext();
  const importPackage = new EaPackage();
  const elementMap = {};
  const elementDataMap = {
    'el-desc': {
      id: 'el-desc',
      name: 'Element With Attribute Description',
      type: 'Work Package',
      attributes: [
        {
          name: 'commit',
          value: '7b38129',
          description: '.github/skills/{ai-generate,backend-api}/SKILL.md',
        },
      ],
    },
  };

  const element = context.ensureElement(importPackage, 'el-desc', elementDataMap, elementMap);

  assert.ok(element, 'element is created');
  assert.strictEqual(element.persistedAttributes.length, 1, 'attribute is persisted on the EA element');
  assert.strictEqual(element.persistedAttributes[0].Default, '7b38129', 'value is written to EA Default');
  assert.strictEqual(
    element.persistedAttributes[0].Notes,
    '.github/skills/{ai-generate,backend-api}/SKILL.md',
    'description is written to EA Notes',
  );
  assert.deepStrictEqual(element.persistedAttributes[0].TaggedValues.tags, {}, 'attribute is not written to tagged values');
}

function importsElementAttributeContentAsNotes() {
  const context = loadImporterContext();
  const importPackage = new EaPackage();
  const elementMap = {};
  const elementDataMap = {
    'el-content': {
      id: 'el-content',
      name: 'Element With Attribute Content',
      type: 'Constraint',
      attributes: [
        {
          name: 'code_file',
          content: 'function main() { return 1; }',
        },
      ],
    },
  };

  const element = context.ensureElement(importPackage, 'el-content', elementDataMap, elementMap);

  assert.ok(element, 'element is created');
  assert.strictEqual(element.persistedAttributes.length, 1, 'attribute is persisted on the EA element');
  assert.strictEqual(element.persistedAttributes[0].Notes, 'function main() { return 1; }', 'content is written to EA Notes');
  assert.strictEqual(element.persistedAttributes[0].Alias, 'content', 'content is marked via Alias');
  assert.strictEqual(element.persistedAttributes[0].Default, '', 'content is not written to EA Default');
  assert.deepStrictEqual(element.persistedAttributes[0].TaggedValues.tags, {}, 'content is not written to tagged values');
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
    this._default = '';
    this.Notes = '';
    this.TaggedValues = new TaggedValueCollection();
  }

  get Default() {
    return this._default;
  }

  set Default(value) {
    if (String(value).length > 250) {
      throw new Error('EA Attribute.Default exceeds short text limit');
    }
    this._default = value;
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
