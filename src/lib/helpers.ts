import { IStructure, AbstractProperty } from "mendixmodelsdk";
import * as _ from 'lodash';
import chalk from 'chalk';

export function getPropertyFromStructure(structure: IStructure , propName: string): AbstractProperty<any, any>|null {
    const r = structure.allProperties().filter(prop => prop.name && prop.name === propName);
    return r ? r[0] : null;
}

export function getPropertyList(structure: IStructure) {
    return structure.allProperties().map(prop => prop.name).filter(n => typeof n !== 'undefined');
}

export interface Logger {
    verbose: boolean;
}
export class Logger {
    constructor(verbose) {
        this.verbose = verbose;
    }

    log(...args) {
        if (this.verbose) {
            console.log.apply(console, args);
        }
    }

    padLog(padding: number = 0, str: string) {

    }

    el(...args: string[]) {
        return chalk.cyan(...args);
    }

    spec(...args: string[]) {
        return chalk.magenta(...args);
    }
}
