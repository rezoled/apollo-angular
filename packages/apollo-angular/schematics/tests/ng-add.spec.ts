import { resolve } from 'path';
import { CompilerOptions } from 'typescript';
import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { createDependenciesMap } from '../install';
import { createTestApp, getFileContent, getJsonFile } from '../utils';

const collectionPath = resolve(__dirname, '../collection.json');

describe('ng-add', () => {
  let runner: SchematicTestRunner;
  let appTree: Tree;

  beforeEach(async () => {
    appTree = await createTestApp();
    runner = new SchematicTestRunner('apollo-angular', collectionPath);
  });

  test('should update package.json dependencies', async () => {
    const tree = await runner.runSchematic('ng-add', {}, appTree);
    const packageJsonPath = '/package.json';
    expect(tree.files).toContain(packageJsonPath);

    const packageJson = getJsonFile(tree, packageJsonPath);
    const { dependencies } = packageJson;

    const dependenciesMap = createDependenciesMap({
      graphql: '16',
    });

    for (const dependency in dependenciesMap) {
      if (dependenciesMap.hasOwnProperty(dependency)) {
        const version = dependenciesMap[dependency];

        expect(dependencies[dependency]).toBe(version);
      }
    }
  });

  test('should add NgModule with GraphQL setup', async () => {
    const tree = await runner.runSchematic('ng-add', {}, appTree);
    const modulePath = '/projects/apollo/src/graphql.module.ts';
    expect(tree.files).toContain(modulePath);

    const content = getFileContent(tree, modulePath);
    expect(content).toMatch('export class GraphQLModule');
  });

  test('should import the NgModule with GraphQL setup to the root module', async () => {
    const tree = await runner.runSchematic('ng-add', {}, appTree);
    const rootModulePath = '/projects/apollo/src/main.ts';
    const content = getFileContent(tree, rootModulePath);

    expect(content).toMatch(/import { GraphQLModule } from '.\/graphql.module'/);
  });

  test('should import HttpClientModule to the root module', async () => {
    const tree = await runner.runSchematic('ng-add', {}, appTree);
    const rootModulePath = '/projects/apollo/src/main.ts';
    const content = getFileContent(tree, rootModulePath);

    expect(content).toMatch(/import { HttpClientModule } from '@angular\/common\/http'/);
  });

  test('should add esnext.asynciterable to tsconfig.json', async () => {
    const tree = await runner.runSchematic('ng-add', {}, appTree);
    const rootModulePath = '/tsconfig.json';
    const config = getJsonFile(tree, rootModulePath);
    const compilerOptions: CompilerOptions = config.compilerOptions;

    expect(compilerOptions.lib).toContain('esnext.asynciterable');
  });
});
