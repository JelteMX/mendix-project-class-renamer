`use strict`;
require('dotenv').config();

import { MendixSdkClient, OnlineWorkingCopy, Project, Revision, Branch, loadAsPromise } from "mendixplatformsdk";
import { ModelSdkClient, IModel, Model, projects, domainmodels, microflows, pages, navigation, texts, security, IStructure, menus, AbstractProperty, configuration, IWorkingCopy } from "mendixmodelsdk";

import when = require('when');
import util = require('util');
import chalk from 'chalk';
import * as _ from 'lodash';
import fs = require('fs-extra');

import { Logger, getPropertyFromStructure, getPropertyList } from './lib/helpers';

// Only edit this part!
const projectId = process.env.PROJECT_ID;
const projectName = process.env.PROJECT_TITLE;
const workingCopyId = process.env.WORKING_COPY;
const moduleName = process.env.MODULE_NAME;
const branchName = typeof process.env.BRANCH !== 'undefined' ? process.env.BRANCH : null; // null for mainline
const filePath = typeof process.env.FILE !== 'undefined' ? process.env.FILE : null;

const verbose = typeof process.env.VERBOSE !== 'undefined' ? process.env.VERBOSE === 'true' : false;
const username = process.env.MODEL_SDK_USER;
const apikey = process.env.MODEL_SDK_TOKEN;

const logger = new Logger(verbose);

const revNo = -1; // -1 for latest
const wc = null;

import { loadAllPages, loadAllLayouts, loadAllSnippets, getAllElements, getAllLayouts, getAllSnippets } from './lib/structures';


if (!username || !apikey) {
    console.error(`Make sure you have set ${chalk.cyan('MODEL_SDK_USER')} and ${chalk.cyan('MODEL_SDK_TOKEN')}`)
}

if (!workingCopyId && (!projectId || !projectName)) {
    console.error(`You have not provided a ${chalk.cyan('WORKING_COPY')}, so we need get a new one. Please make sure the following
things are set: ${chalk.cyan('PROJECT_ID')}, ${chalk.cyan('PROJECT_TITLE')}`);
}

const client = new MendixSdkClient(username, apikey);
const project = new Project(client, projectId, projectName);

function load() {
    if (filePath !== null) {
        const workingCopyParams: configuration.ICreateWorkingCopyParameters = {
            name: projectName + 'Local',
            template: filePath
        }
        const apiKeyClient = Model.createSdkClient({
            credentials: {
                username,
                apikey,
            }
        });
        apiKeyClient.createAndOpenWorkingCopy(workingCopyParams, model => {
            console.log(model);
        }, (error) => {
            console.log('error', error);
        })
    } else {
        client
        .platform()
        .createOnlineWorkingCopy(project, new Revision(revNo, new Branch(project, branchName)))
        .then(workingCopy => {
            console.log(`\nCreated a working copy. Provide this as WORKING_COPY=${chalk.cyan(workingCopy.id())} and run again.\n`);
            return;
        })
        .done(() => {
            console.log(`done`);
        }, error => {
            console.log(`error`, error);
        })
    }
}

async function main() {
    let model: IModel;
    try {
        model = await getWorkingCopy(client, workingCopyId); util.log(`model loaded`);
    } catch (e) {
        console.log('Error opening model: \n', e);
        process.exit(1);
    }

    const REPLACER = 'question_KOLOM';
    const REPLACEMENT = 'question_column';
    const DRY_RUN = false;

    const pages = await loadAllPages(model); util.log(`pages loaded`);
    const snippets = await loadAllSnippets(model); util.log(`snippets loaded`);
    const layouts = await loadAllLayouts(model); util.log(`layouts loaded`);

    const pageElements = getAllElements(pages, moduleName);
    const snippetElements = getAllSnippets(snippets, moduleName);
    const layoutElements = getAllLayouts(layouts, moduleName);

    const allElements = _.concat(pageElements, snippetElements, layoutElements);
    let changed = false;

    allElements.forEach(el => {
        const classProp = getPropertyFromStructure(el, 'class');
        const className = (classProp && classProp.get() || '').trim();
        if (className) {
            const arr = className.split(' ');
            const index = arr.indexOf(REPLACER);
            if (index !== -1) {
                changed = true;
                console.log('================================>', arr);
                arr[index] = REPLACEMENT;
                const newVal = arr.join(' ');
                classProp.observableValue.set(newVal);
            }
        }
    });

    const revision = new Revision(revNo, new Branch(project, branchName));
    const onlineWorkingCopy: OnlineWorkingCopy = new OnlineWorkingCopy(client, workingCopyId, revision, model);

    if (DRY_RUN) {
        console.log('DRY RUN');
        await closeConnection(model);
    } else if (changed) {
        client
        .platform()
        .commitToTeamServer(onlineWorkingCopy, branchName)
        .then(rev => {
            console.log('Commit');
            console.log(rev);
        })
        .catch(e => {
            console.log('Error');
            console.log(e);
        })
        .finally(async () => {
            await closeConnection(model);
        });
    }
}

// Processing
function getWorkingCopy(client: MendixSdkClient, id: string): Promise<IModel> {
    return new Promise((resolve, reject) => {
        client.model().openWorkingCopy(id, resolve, reject);
    })
}

async function closeConnection(model: IModel) {
    await new Promise<void>((resolve, reject) => {
        model.closeConnection(
            () => {
                console.log(`Closed connection to Model API successfully.`);
                resolve();
            },
            (err) => {
                console.error(`Failed to closed connection to Model API. Error: ${err}`);
                reject();
            }
        );
    });
}

if (workingCopyId) {
    main();
} else {
    console.log('No working copy provided. Running the loader');
    load();
}
