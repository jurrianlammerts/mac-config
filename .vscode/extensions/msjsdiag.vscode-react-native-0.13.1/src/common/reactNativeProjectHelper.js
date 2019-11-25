"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.
Object.defineProperty(exports, "__esModule", { value: true });
const Q = require("q");
const fs = require("fs");
const path = require("path");
const semver = require("semver");
const url_1 = require("url");
const package_1 = require("./node/package");
const errorHelper_1 = require("../common/error/errorHelper");
const internalErrorCode_1 = require("../common/error/internalErrorCode");
class ReactNativeProjectHelper {
    static getRNVersionsWithBrokenMetroBundler() {
        // https://github.com/Microsoft/vscode-react-native/issues/660 for details
        return ["0.54.0", "0.54.1", "0.54.2", "0.54.3", "0.54.4"];
    }
    static getReactNativeVersion(projectRoot) {
        return ReactNativeProjectHelper.getReactNativePackageVersionFromNodeModules(projectRoot)
            .catch(err => {
            return ReactNativeProjectHelper.getReactNativeVersionFromProjectPackage(projectRoot);
        });
    }
    static getReactNativePackageVersionFromNodeModules(projectRoot) {
        return new package_1.Package(projectRoot).dependencyPackage("react-native").version()
            .then(version => ReactNativeProjectHelper.processVersion(version))
            .catch(err => {
            throw errorHelper_1.ErrorHelper.getInternalError(internalErrorCode_1.InternalErrorCode.ReactNativePackageIsNotInstalled);
        });
    }
    static getReactNativeVersionFromProjectPackage(cwd) {
        const rootProjectPackageJson = new package_1.Package(cwd);
        return rootProjectPackageJson.dependencies()
            .then(dependencies => {
            if (dependencies["react-native"]) {
                return ReactNativeProjectHelper.processVersion(dependencies["react-native"]);
            }
            return rootProjectPackageJson.devDependencies()
                .then(devDependencies => {
                if (devDependencies["react-native"]) {
                    return ReactNativeProjectHelper.processVersion(devDependencies["react-native"]);
                }
                return "";
            });
        })
            .catch(err => {
            return "";
        });
    }
    static processVersion(version) {
        try {
            return new url_1.URL(version) && "SemverInvalid: URL";
        }
        catch (err) {
            const versionObj = semver.coerce(version);
            return (versionObj && versionObj.toString()) || "SemverInvalid";
        }
    }
    /**
     * Ensures that we are in a React Native project
     * Otherwise, displays an error message banner
     */
    static isReactNativeProject(projectRoot) {
        if (!projectRoot || !fs.existsSync(path.join(projectRoot, "package.json"))) {
            return Q(false);
        }
        return this.getReactNativeVersion(projectRoot)
            .then(version => {
            return !!(version);
        });
    }
    static isHaulProject(projectRoot) {
        if (!projectRoot || !fs.existsSync(path.join(projectRoot, "package.json"))) {
            return false;
        }
        const packageJson = require(path.join(projectRoot, "package.json"));
        const haulVersion = packageJson.devDependencies && packageJson.devDependencies.haul;
        return !!haulVersion;
    }
}
exports.ReactNativeProjectHelper = ReactNativeProjectHelper;

//# sourceMappingURL=reactNativeProjectHelper.js.map
