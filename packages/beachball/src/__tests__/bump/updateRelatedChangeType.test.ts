import { updateRelatedChangeType } from '../../bump/updateRelatedChangeType';
import { BumpInfo } from '../../types/BumpInfo';
import _ from 'lodash';

describe('updateRelatedChangeType', () => {
  const bumpInfoFixture: BumpInfo = ({
    changes: new Map(),
    dependents: {},
    packageChangeTypes: {},
    dependentChangeTypes: {
      foo: 'patch',
    },
    packageInfos: {
      foo: {
        name: 'foo',
        options: { disallowedChangeTypes: [], defaultNpmTag: 'latest' },
      },
      bar: {
        name: 'bar',
        options: { disallowedChangeTypes: [], defaultNpmTag: 'latest' },
      },
    },
    modifiedPackages: new Set(),
    newPackages: new Set(),
    packageGroups: {},
  } as unknown) as BumpInfo;

  it('should bump dependent packages with "patch" change type by default', () => {
    const bumpInfo = _.merge(_.cloneDeep(bumpInfoFixture), {
      dependents: {
        foo: ['bar'],
      },
      packageChangeTypes: {
        foo: 'minor',
      },
      dependentChangeTypes: {
        foo: 'patch',
      },
      packageInfos: {
        bar: {
          dependencies: {
            foo: '1.0.0',
          },
        },
      },
    });

    updateRelatedChangeType('foo', 'minor', bumpInfo, true);

    expect(bumpInfo.packageChangeTypes['foo']).toBe('minor');
    expect(bumpInfo.packageChangeTypes['bar']).toBe('patch');
  });

  it('should bump dependent packages according to the bumpInfo.dependentChangeTypes', () => {
    const bumpInfo = _.merge(_.cloneDeep(bumpInfoFixture), {
      dependents: {
        foo: ['bar'],
      },
      packageChangeTypes: {
        foo: 'patch',
      },
      dependentChangeTypes: {
        foo: 'minor',
      },
      packageInfos: {
        bar: {
          dependencies: {
            foo: '1.0.0',
          },
        },
      },
    });

    updateRelatedChangeType('foo', 'patch', bumpInfo, true);

    expect(bumpInfo.packageChangeTypes['foo']).toBe('patch');
    expect(bumpInfo.packageChangeTypes['bar']).toBe('minor');
  });

  it('should bump all packages in a group together', () => {
    const bumpInfo = _.merge(_.cloneDeep(bumpInfoFixture), {
      dependentChangeTypes: {
        foo: 'minor',
      },
      packageInfos: {
        foo: {
          group: 'grp',
        },
        bar: {
          group: 'grp',
        },
        unrelated: {},
      },
      packageGroups: { grp: ['foo', 'bar'] },
    });

    updateRelatedChangeType('foo', 'minor', bumpInfo, true);

    expect(bumpInfo.packageChangeTypes['foo']).toBe('minor');
    expect(bumpInfo.packageChangeTypes['bar']).toBe('minor');
    expect(bumpInfo.packageChangeTypes['unrelated']).toBeUndefined();
  });

  it('should bump all packages in a group together with dependents', () => {
    const bumpInfo = _.merge(_.cloneDeep(bumpInfoFixture), {
      dependentChangeTypes: {
        bar: 'patch',
      },
      dependents: {
        bar: ['dep'],
      },
      packageInfos: {
        foo: {
          group: 'grp',
        },
        bar: {
          group: 'grp',
          dependencies: {
            dep: '1.0.0',
          },
        },
        dep: {
          name: 'dep',
          options: { disallowedChangeTypes: [], defaultNpmTag: 'latest' },
        },
        unrelated: {
          name: 'unrelated',
          options: { disallowedChangeTypes: [], defaultNpmTag: 'latest' },
        },
      },
      packageGroups: { grp: ['foo', 'bar'] },
    });

    updateRelatedChangeType('foo', 'minor', bumpInfo, true);

    expect(bumpInfo.packageChangeTypes['foo']).toBe('minor');
    expect(bumpInfo.packageChangeTypes['bar']).toBe('minor');
    expect(bumpInfo.packageChangeTypes['dep']).toBe('patch');
    expect(bumpInfo.packageChangeTypes['unrelated']).toBeUndefined();
  });

  it('should respect disallowed change type', () => {
    const bumpInfo = _.merge(_.cloneDeep(bumpInfoFixture), {
      packageInfos: {
        foo: {
          options: { disallowedChangeTypes: ['minor', 'major'], defaultNpmTag: 'latest' },
        },
      },
    });

    updateRelatedChangeType('foo', 'major', bumpInfo, true);

    expect(bumpInfo.packageChangeTypes['foo']).toBe('patch');
  });
});