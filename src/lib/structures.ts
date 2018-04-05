import { MendixSdkClient, OnlineWorkingCopy, Project, Revision, Branch, loadAsPromise } from "mendixplatformsdk";
import { ModelSdkClient, IModel, Model, projects, domainmodels, microflows, pages, customwidgets, navigation, texts, security, IStructure, menus, AbstractProperty, Structure } from "mendixmodelsdk";

import when = require('when');
import util = require('util');
import chalk from 'chalk';

import { getPropertyFromStructure, Logger } from './helpers';

// LOADERS

export function loadAllPages(model: IModel): When.Promise<pages.Page[]> {
    return when.all(model.allPages().map(page => new Promise((resolve, reject) => { page.load(resolve) })));
}

export function loadAllLayouts(model: IModel): When.Promise<pages.Layout[]> {
    return when.all(model.allLayouts().map(layout => new Promise((resolve, reject) => { layout.load(resolve) })));
}

export function loadAllSnippets(model: IModel): When.Promise<pages.Snippet[]> {
    return when.all(model.allSnippets().map(snippet => new Promise((resolve, reject) => { snippet.load(resolve) })));
}

// ELEMENTS

export function getAllElements(allPages: pages.Page[], moduleName: string): IStructure[] {
    const structures:IStructure[] = [];
    allPages.forEach(page => {
        if (moduleName !== '' && page.qualifiedName.indexOf(moduleName) !== 0) {
            return;
        }
        structures.push(page);
        page.traverse(structure => {
            const nameProp = getPropertyFromStructure(structure, `name`);
            const classProp = getPropertyFromStructure(structure, `class`);
            if (nameProp && classProp && !(structure instanceof pages.Page)) {
                structures.push(structure);
            }
        });
    });
    return structures;
}

export function getAllSnippets(allSnippets: pages.Snippet[], moduleName: string): IStructure[] {
    const structures:IStructure[] = [];
    allSnippets.forEach(snippet => {
        if (moduleName !== '' && snippet.qualifiedName.indexOf(moduleName) !== 0) {
            return;
        }
        snippet.traverse(structure => {
            const nameProp = getPropertyFromStructure(structure, `name`);
            const classProp = getPropertyFromStructure(structure, `class`);
            if (nameProp && classProp && !(structure instanceof pages.Page)) {
                structures.push(structure);
            }
        });
    });
    return structures;
}

export function getAllLayouts(allLayouts: pages.Layout[], moduleName: string): IStructure[] {
    const structures:IStructure[] = [];
    allLayouts.forEach(layout => {
        if (moduleName !== '' && layout.qualifiedName.indexOf(moduleName) !== 0) {
            return;
        }
        structures.push(layout);
        layout.traverse(structure => {
            const nameProp = getPropertyFromStructure(structure, `name`);
            const classProp = getPropertyFromStructure(structure, `class`);
            if (nameProp && classProp && !(structure instanceof pages.Layout)) {
                structures.push(structure);
            }
        });
    });
    return structures;
}
