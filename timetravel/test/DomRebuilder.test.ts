import { DomActionType } from '@ulixee/hero-interfaces/IDomChangeEvent';
import DomRebuilder from '../lib/DomRebuilder';

describe('DomRebuilder tests', () => {
  const domRebuilder = new DomRebuilder(new Set([1]));
  let eventIndex = 1;

  test('it should be rebuild a basic dom structure', () => {
    const base = {
      frameId: 1,
      tabId: 1,
      timestamp: Date.now(),
      commandId: 1,
    };
    const dom = [
      {
        ...base,
        eventIndex: (eventIndex += 1),
        action: DomActionType.newDocument,
        nodeId: -1,
        textContent: 'http://localhost:64747/test1',
      },
      {
        ...base,
        eventIndex: (eventIndex += 1),
        action: DomActionType.added,
        nodeId: 1,
        nodeType: 9,
      },
      {
        ...base,
        eventIndex: (eventIndex += 1),
        action: DomActionType.added,
        nodeId: 2,
        nodeType: 1,
        tagName: 'HTML',
        parentNodeId: 1,
      },
      {
        ...base,
        eventIndex: (eventIndex += 1),
        action: DomActionType.added,
        nodeId: 3,
        nodeType: 1,
        tagName: 'HEAD',
        parentNodeId: 2,
      },
      {
        ...base,
        eventIndex: (eventIndex += 1),
        action: DomActionType.added,
        nodeId: 4,
        nodeType: 1,
        tagName: 'BODY',
        previousSiblingId: 3,
        parentNodeId: 2,
      },
      {
        ...base,
        eventIndex: (eventIndex += 1),
        action: DomActionType.added,
        nodeId: 5,
        nodeType: 1,
        tagName: 'UL',
        parentNodeId: 4,
      },
    ];

    domRebuilder.apply({ timestamp: dom[0].timestamp, commandId: 1, changeEvents: dom as any });

    expect(domRebuilder.getFrameNodes(1)).toHaveLength(5);
    expect(Object.values(domRebuilder.getNodeStats(1).byId)).toHaveLength(0);
    expect(Object.values(domRebuilder.getNodeStats(1).byClass)).toHaveLength(0);
  });

  test('it should be able to add', () => {
    const base = {
      frameId: 1,
      tabId: 1,
      timestamp: Date.now(),
      commandId: 1,
    };
    const dom = [
      {
        ...base,
        eventIndex: (eventIndex += 1),
        action: DomActionType.added,
        nodeId: 6,
        nodeType: 1,
        tagName: 'LI',
        parentNodeId: 5,
        attributes: { class: 'lis' },
      },
      {
        ...base,
        eventIndex: (eventIndex += 1),
        action: DomActionType.added,
        nodeId: 7,
        nodeType: 3,
        parentNodeId: 6,
        textContent: 'li1',
      },
      {
        ...base,
        eventIndex: (eventIndex += 1),
        action: DomActionType.added,
        nodeId: 8,
        nodeType: 1,
        tagName: 'LI',
        previousSiblingId: 6,
        attributes: { class: 'lis' },
        parentNodeId: 5,
      },
      {
        ...base,
        eventIndex: (eventIndex += 1),
        action: DomActionType.added,
        nodeId: 9,
        nodeType: 3,
        parentNodeId: 8,
        textContent: 'li2',
      },
    ];

    domRebuilder.apply({ timestamp: dom[0].timestamp, commandId: 1, changeEvents: dom as any });

    expect(domRebuilder.getFrameNodes(1)).toHaveLength(9);
    expect(Object.values(domRebuilder.getNodeStats(1).byId)).toHaveLength(0);
    expect(Object.values(domRebuilder.getNodeStats(1).byClass)).toHaveLength(1);

    expect(domRebuilder.getNodeStats(1).byClass.lis.size).toBe(2);

    const xpath = domRebuilder.getXpathGenerator(1);
    expect(xpath.getTagPath(domRebuilder.getNode(1, 8))).toBe('/HTML/BODY/UL/LI[2]');
  });

  test('it should be able to reorder nodes', () => {
    const base = {
      frameId: 1,
      tabId: 1,
      timestamp: Date.now(),
      commandId: 1,
    };
    const dom = [
      {
        ...base,
        eventIndex: (eventIndex += 1),
        action: DomActionType.removed,
        nodeId: 6,
        nodeType: 1,
        parentNodeId: 5,
      },
      {
        ...base,
        eventIndex: (eventIndex += 1),
        action: DomActionType.added,
        nodeId: 6,
        parentNodeId: 5,
        previousSiblingId: 8,
      },
    ];

    domRebuilder.apply({ timestamp: dom[0].timestamp, commandId: 1, changeEvents: dom as any });

    expect(domRebuilder.getFrameNodes(1)).toHaveLength(9);
    expect(Object.values(domRebuilder.getNodeStats(1).byId)).toHaveLength(0);
    expect(Object.values(domRebuilder.getNodeStats(1).byClass)).toHaveLength(1);

    expect(domRebuilder.getNodeStats(1).byClass.lis.size).toBe(2);

    const xpath = domRebuilder.getXpathGenerator(1);
    expect(xpath.getTagPath(domRebuilder.getNode(1, 8))).toBe('/HTML/BODY/UL/LI[1]');
  });

  test('it should be able to remove nodes', () => {
    const base = {
      frameId: 1,
      tabId: 1,
      timestamp: Date.now(),
      commandId: 1,
    };
    const dom = [
      {
        ...base,
        eventIndex: (eventIndex += 1),
        action: DomActionType.removed,
        nodeId: 8,
        nodeType: 1,
        parentNodeId: 5,
      },
    ];

    domRebuilder.apply({ timestamp: dom[0].timestamp, commandId: 1, changeEvents: dom as any });

    expect(domRebuilder.getFrameNodes(1)).toHaveLength(9);
    expect(domRebuilder.getFrameNodes(1).filter(x => x.isConnected)).toHaveLength(7);
    expect(Object.values(domRebuilder.getNodeStats(1).byId)).toHaveLength(0);
    expect(Object.values(domRebuilder.getNodeStats(1).byClass)).toHaveLength(1);

    const xpath = domRebuilder.getXpathGenerator(1);
    expect(xpath.getTagPath(domRebuilder.getNode(1, 6))).toBe('/HTML/BODY/UL/LI');
  });
});
