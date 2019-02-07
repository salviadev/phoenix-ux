let fs = require('fs');
let path = require('path');
let dsutils = require('@phoenix/phoenix-seed').dsutils;
let layoutUtils = require('@phoenix/phoenix-seed').layoutUtils;
let schemaUtils = require('@phoenix/phoenix-seed').schemaUtils;
let toolboxUtils = require('@phoenix/phoenix-seed').toolboxUtils;
let initRootPath = require('@phoenix/phoenix-seed').initRootPath;
let copyJsonFiles = require('@phoenix/phoenix-seed').copyJsonFiles;
const sass = require('node-sass');

const date = new Date();
const compileVersion = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDay(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCMilliseconds()) + '';




function _buildLib(grunt) {
    let deploy = grunt.option('deploy');
    if (deploy)
        grunt.task.run('lib-deploy');
    else
        grunt.task.run('lib');
}


function _build(grunt, moduleName) {
    if (moduleName === "core") return;
    if (moduleName === "shared") {
        return _buildLib(grunt);
    }

    let src = grunt.config.get('srcRootPath');
    let application = grunt.config.get('application');
    let cfg = src + '/' + moduleName + '/' + 'config.json';
    let moduleConfig = grunt.file.readJSON(cfg);

    let glbCfg = grunt.config.get('glbCfg');
    grunt.config.set('glbCfg', glbCfg);
    if (!moduleConfig)
        return grunt.fail.fatal("File not found: " + cfg);
    application.title = moduleConfig.application.title;
    application.name = moduleName;
    var deploy = grunt.option('deploy');
    if (deploy) {
        grunt.config.set('deploy', { release: 'true', authMode: 'admin', releaseVersion: compileVersion });
    }

    grunt.config.set('application', application);
    grunt.task.run('compile');

    grunt.config.set('htmlPath', grunt.config.get('distPath') + '/' + application.name);
    grunt.config.set('htmlPathPrefix', '');
    grunt.config.set('bowerPath', '../libs');
    var hb = grunt.config.getRaw('htmlbuild');
    if (moduleConfig.plugins && moduleConfig.plugins.debug && moduleConfig.plugins.dist) {
        hb.debug.options.scripts.application_plugins.files = (moduleConfig.plugins.debug.scripts ? moduleConfig.plugins.debug.scripts : moduleConfig.plugins.debug);
        hb.dist.options.scripts.application_plugins.files = (moduleConfig.plugins.dist.scripts ? moduleConfig.plugins.dist.scripts : moduleConfig.plugins.dist);

        hb.dist.options.styles.application_plugins.files = moduleConfig.plugins.dist.styles ? moduleConfig.plugins.dist.styles : [];
        hb.debug.options.styles.application_plugins.files = moduleConfig.plugins.debug.styles ? moduleConfig.plugins.debug.styles : [];
    } else {
        hb.debug.options.scripts.application_plugins.files = [];
        hb.dist.options.scripts.application_plugins.files = [];
        hb.debug.options.styles.application_plugins.files = [];
        hb.dist.options.styles.application_plugins.files = [];
    }
    hb.dist.options.scripts.application_plugins_before.files = moduleConfig.plugins_before && moduleConfig.plugins_before.dist && moduleConfig.plugins_before.dist.scripts ? moduleConfig.plugins_before.dist.scripts : [];
    hb.debug.options.scripts.application_plugins_before.files = moduleConfig.plugins_before && moduleConfig.plugins_before.debug && moduleConfig.plugins_before.debug.scripts ? moduleConfig.plugins_before.debug.scripts : [];

    grunt.config.set('htmlbuild', hb);
    grunt.task.run('html-build');
    if (deploy) {
        grunt.task.run('clean:dist');
        // merge pages with datasets
        grunt.task.run('integrateDatasets');
        // merge forms with subforms
        grunt.task.run('integrateSubForms');
        // merge schemas
        grunt.task.run('mergeSchemas');
        // deploy
        grunt.task.run('createToolbox');

        let tpl = grunt.config.get('third_party_libs');
        if (tpl && tpl.deploy && tpl.deploy.length) {
            const toAdd = {
                expand: true,
                cwd: '<%= distPath %>',
                src: [
                ],
                dest: '<%= releasePath %>'
            }
            const cc = grunt.config.get('copy');
            const files = cc.deploy.files;
            files.push(toAdd);
            tpl.deploy.forEach(packageName => {
                toAdd.src.push('libs/' + packageName + '/**/*');
            });
            grunt.config.set('copy', cc);
        }
        grunt.task.run('copy:deploy');
        var co = grunt.config.getRaw('compress');
        let dd = new Date();
        ss = dd.toISOString().substr(0, 10);
        co.main.options.archive = 'PhoenixUX_' + ss + '.zip';
        grunt.task.run('compress:main');

    }
}


module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        glbCfg: grunt.file.readJSON('./src/global.json'),
        third_party_libs: grunt.file.readJSON('plugins.json'),
        application: {
            name: "Invalid Application Name",
        },
        tempPath: './temp',
        srcRootPath: './src',
        srcCoreRootPath: './src/core',
        srcLibRootPath: './src/shared',
        distPath: './public',
        node_modules: './node_modules',
        bowerPath: '../libs',
        bowerDirPath: './public/libs',
        releasePath: './dist',

        htmlPath: '<%= distPath %>/<%= application.name %>',
        htmlPathPrefix: '',
        prefixHtmlRoot: '',
        deploy: {
            release: "false",
            authMode: 'dev',
            releaseVersion: compileVersion

        },
        rootPath: './public',
        replace: {
            dist: {
                files: [{
                    src: ['<%= srcRootPath %>/<%= application.name %>/widgets/core/main.ts'],
                    dest: '<%= srcRootPath %>/<%= application.name %>/widgets/core/main-compiled.ts'
                }],
                options: {
                    patterns: [
                        {
                            match: 'application_name',
                            replacement: '<%= application.name %>'
                        },
                        {
                            match: 'application_title',
                            replacement: '<%= application.title %>'
                        },
                        {
                            match: /glb_cfg/g,
                            replacement: '<%= glbCfg %>'
                        }
                    ]
                }
            }
        },
        ts: {
            all: {
                files: [
                    {
                        src: [
                            '<%= srcRootPath %>/<%= application.name %>/widgets/core/main-compiled.ts',
                            '<%= srcRootPath %>/<%= application.name %>/**/*.ts',
                            '!<%= srcRootPath %>/<%= application.name %>/widgets/core/main.ts',
                        ],
                        dest: '<%= tempPath %>/<%= application.name %>/ts/ts.js'
                    }
                ],
                options: {
                    sourceMap: false,
                    comments: false,
                    lib: ["es2016", "dom"],
                    noResolve: false
                }
            },
            lib: {
                files: [
                    {
                        src: [
                            '<%= srcLibRootPath %>/js/**/*.ts'
                        ],
                        dest: '<%= distPath %>/shared/js/shared.js'

                    }
                ],
                options: {
                    comments: false,
                    noResolve: false,
                    declaration: false,
                    lib: ["es2016", "dom"],
                    sourceMap: false
                }
            }

        },
        ngtemplates: {
            application: {
                cwd: '<%= srcRootPath %>/<%= application.name %>/',
                src: '**/*.html',
                dest: '<%= tempPath %>/<%= application.name %>/js/widgets-tpls.js',
                options: {
                    htmlmin: {
                        collapseWhitespace: true,
                        collapseBooleanAttributes: true,
                        removeComments: true
                    },
                    module: '<%= application.name %>',
                    url: function (file) {
                        var path = require('path');
                        file = path.basename(file);
                        return './templates/' + file;
                    },
                }
            }

        },
        compress: {
            main: {
                options: {
                    mode: 'zip',
                    archive: 'YourApplicationName.zip'
                },
                expand: true,
                cwd: 'dist/',
                src: ['**/*'],
                dest: '.'
            }
        },
        concat: {
            options: {
                stripBanners: true,
            },
            application: {
                src: [
                    '<%= tempPath %>/<%= application.name %>/ts/ts.js',
                    '<%= tempPath %>/<%= application.name %>/js/*.js',
                    '<%= srcRootPath %>/<%= application.name %>/**/*.js'
                ],
                dest: '<%= distPath %>/<%= application.name %>/application.js'
            }
        },

        cssmin: {
            app: {
                files: [{
                    src: '<%= distPath %>/<%= application.name %>/css/application.css',
                    dest: '<%= distPath %>/<%= application.name %>/css/application.min.css'

                }]
            },
            lib: {
                files: [{
                    src: '<%= distPath %>/shared/css/shared.css',
                    dest: '<%= distPath %>/shared/css/shared.min.css'

                }]
            }

        },

        uglify: {
            options: {
                sourceMap: true
            },
            application: {
                src: '<%= distPath %>/<%= application.name %>/application.js',
                dest: '<%= distPath %>/<%= application.name %>/application.min.js'
            },
            lib: {
                src: '<%= distPath %>/shared/js/shared.js',
                dest: '<%= distPath %>/shared/js/shared.min.js'
            }

        },

        copy: {
            libimg: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= srcLibRootPath %>/img',
                        src: ['**/*'],
                        dest: '<%= distPath %>/shared/img'
                    },
                    {
                        expand: true,
                        cwd: '<%= srcLibRootPath %>/html',
                        src: ['**/*'],
                        dest: '<%= distPath %>/shared/html'
                    }
                ]
            },
            core: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= srcRootPath %>/core/widgets/core/',
                        src: ['**/*.*'],
                        dest: '<%= srcRootPath %>/<%= application.name %>/widgets/core/'
                    },
                    {
                        expand: true,
                        cwd: '<%= srcRootPath %>/core/ui/',
                        src: ['**/*.*'],
                        dest: '<%= srcRootPath %>/<%= application.name %>/ui/'
                    }
                ]
            },
            "lib-deploy": {
                files: [
                    {
                        expand: true,
                        cwd: '<%= distPath %>/shared',
                        src: ['./**/*.*'],
                        dest: '<%= releasePath %>/shared/',
                        filter: 'isFile'
                    }
                ]
            },
            app: {
                files: [
                    {
                        expand: true,
                        flatten: true,
                        src: ['<%= srcRootPath %>/<%= application.name %>/**/img/*.*'],
                        dest: '<%= distPath %>/<%= application.name %>/img/',
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: ['<%= srcRootPath %>/<%= application.name %>/**/font/*.*'],
                        dest: '<%= distPath %>/<%= application.name %>/font/',
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: ['<%= srcRootPath %>/<%= application.name %>/ui/pages/*.json'],
                        dest: '<%= distPath %>/<%= application.name %>/ui/pages/'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: ['<%= srcRootPath %>/<%= application.name %>/ui/forms/*.json'],
                        dest: '<%= distPath %>/<%= application.name %>/ui/forms/'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: ['<%= srcRootPath %>/<%= application.name %>/ui/forms/meta/*.json'],
                        dest: '<%= distPath %>/<%= application.name %>/ui/forms/meta/'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: ['<%= srcRootPath %>/<%= application.name %>/ui/toolboxes/*.json'],
                        dest: '<%= distPath %>/<%= application.name %>/ui/toolboxes/'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: ['<%= srcRootPath %>/<%= application.name %>/ui/menus/*.json'],
                        dest: '<%= distPath %>/<%= application.name %>/ui/menus/'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: ['<%= srcRootPath %>/<%= application.name %>/photos/*'],
                        dest: '<%= distPath %>/<%= application.name %>/photos/'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: ['<%= srcRootPath %>/<%= application.name %>/data/*'],
                        dest: '<%= distPath %>/<%= application.name %>/data/'
                    },
                    {
                        expand: true,
                        flatten: true,
                        src: ['<%= srcRootPath %>/<%= application.name %>/model.html'],
                        dest: '<%= distPath %>/<%= application.name %>'
                    }

                ]
            },
            deploy: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= distPath %>/<%= application.name %>',
                        src: ['**/*', '!libs/**'],
                        dest: '<%= releasePath %>/<%= application.name %>'
                    },
                    {
                        expand: true,
                        cwd: '<%= distPath %>',
                        src: [
                            'libs/@phoenix/phoenix-app/**/*.min.*',
                            'libs/@phoenix/phoenix-cli/dist/**/*',
                            'libs/ismobilejs/**/*.min.*',
                            'libs/es6-promise/**/*.min.*',
                            'libs/@phoenix/phoenix-app/dist/**/*.json',
                            'libs/@phoenix/phoenix-app/*dist/img/*.*',
                            'libs/@phoenix/phoenix-app/*dist/font/*.*',
                            'libs/popper.js/dist/umd/*.*',
                            'libs/bootstrap4-datetimepicker/build/**/*.*',
                            'libs/moment/min/**/*.*'
                        ],
                        dest: '<%= releasePath %>'
                    },
                    {
                        expand: true,
                        cwd: '<%= srcRootPath %>',
                        src: ['Web.config'],
                        dest: '<%= releasePath %>'
                    }

                ]
            },
            install_client: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= node_modules %>',
                        src: [
                            'jquery/dist/*.*',
                            '@phoenix/phoenix-app/dist/**/*.*',
                            '@phoenix/phoenix-cli/dist/**/*.*',
                            'es6-promise/dist/*.*',
                            'popper.js/dist/umd/*.*',
                            'ismobilejs/*.*',
                            'angular/*.*',
                            'angular-route/*.*',
                            'bootstrap-datepicker/dist/**/*.*'
                        ],
                        dest: '<%= bowerDirPath %>'
                    }
                ]


            },
            app_config: {
                files: [
                    {
                        expand: true,
                        flatten: true,
                        src: ['<%= srcRootPath %>/app.json'],
                        dest: '<%= distPath %>'
                    }
                ]
            },
            'deploy-root-index': {
                files: [
                    {
                        expand: true,
                        cwd: '<%= distPath %>',
                        src: ['index.html', 'app.json'],
                        dest: '<%= releasePath %>'
                    }
                ]
            }

        },
        sass: {
            options: {
                implementation: sass,
                includePaths: ['scss'],
                precision: 6,
                sourceComments: false,
                sourceMap: true,
                outputStyle: 'expanded'
            },
            lib: {
                files: {
                    '<%= distPath %>/shared/css/shared.css': '<%= srcLibRootPath %>/sass/base.scss'
                }
            },
            application: {
                files: {
                    '<%= distPath %>/<%= application.name %>/css/application.css': '<%= srcRootPath %>/<%= application.name %>/app.scss'
                }
            }


        },
        htmlbuild: {
            "redirect-debug": {
                src: '<%= srcCoreRootPath %>/html/redirect-debug.html',
                dest: '<%= distPath %>/debug.html',
                options: {
                    beautify: true,
                    relative: false
                }

            },
            "redirect-release": {
                src: '<%= srcCoreRootPath %>/html/redirect-release.html',
                dest: '<%= distPath %>/index.html',
                options: {
                    beautify: true,
                    relative: false
                }

            },
            debug: {
                src: '<%= htmlPath %>/model.html',
                dest: '<%= htmlPath %>/debug.html',
                options: {
                    beautify: true,
                    relative: false,
                    scripts: {
                        core: {
                            cwd: '<%= htmlPath %>',
                            files: [
                                '<%= bowerPath %>/@phoenix/phoenix-app/dist/js/app.js'
                            ]
                        },
                        phoenix: {
                            cwd: '<%= htmlPath %>',
                            files: ['<%= bowerPath %>/@phoenix/phoenix-cli/dist/js/phoenix.js',
                                '<%= bowerPath %>/@phoenix/phoenix-cli/dist/js/phoenix.widgets.js',
                                '<%= bowerPath %>/@phoenix/phoenix-cli/dist/js/phoenix.angular.js',
                                '<%= bowerPath %>/@phoenix/phoenix-cli/dist/js/phoenix.widgets.angular.js'
                            ]
                        },
                        jquery: {
                            cwd: '<%= htmlPath %>',
                            files: [
                                '<%= bowerPath %>/jquery/dist/jquery.js'
                            ]
                        },
                        third_party: {
                            cwd: '<%= htmlPath %>',
                            files: [
                                '<%= bowerPath %>/es6-promise/dist/es6-promise.js',
                                '<%= bowerPath %>/popper.js/dist/umd/popper.js',
                                '<%= bowerPath %>/@phoenix/phoenix-cli/dist/bootstrap-theme/js/bootstrap.js',
                                '<%= bowerPath %>/ismobilejs/isMobile.js',
                                '<%= bowerPath %>/bootstrap-datepicker/dist/js/bootstrap-datepicker.js'
                            ]
                        },
                        angular: {
                            cwd: '<%= htmlPath %>',
                            files: [
                                '<%= bowerPath %>/angular/angular.js',
                                '<%= bowerPath %>/angular-route/angular-route.js'
                            ]
                        },
                        application_plugins: {
                            cwd: '<%= htmlPath %>',
                            files: [
                            ]
                        },
                        application_plugins_before: {
                            cwd: '<%= htmlPath %>',
                            files: [
                            ]
                        },
                        application: {
                            cwd: '<%= htmlPath %>',
                            files: [
                                '<%= htmlPathPrefix %>../shared/js/shared.js',
                                '<%= htmlPathPrefix %>application.js'
                            ]
                        }
                    },
                    styles: {
                        phoenix: {
                            cwd: '<%= htmlPath %>',
                            files: [
                                '<%= bowerPath %>/@phoenix/phoenix-cli/dist/css/phoenix.widgets.css',
                                '<%= bowerPath %>/@phoenix/phoenix-cli/dist/css/phoenix.css'
                            ]
                        },
                        phoenix_fonts: {
                            cwd: '<%= htmlPath %>',
                            files: [
                                '<%= bowerPath %>/@phoenix/phoenix-cli/dist/css/phoenix.fonts.css'
                            ]
                        },
                        third_party: {
                            cwd: '<%= htmlPath %>',
                            files: [
                                '<%= bowerPath %>/bootstrap-datepicker/dist/css/bootstrap-datepicker.css'
                            ]
                        },
                        application_plugins: {
                            cwd: '<%= htmlPath %>',
                            files: [
                            ]
                        },
                        core: {
                            cwd: '<%= htmlPath %>',
                            files: ['<%= bowerPath %>/@phoenix/phoenix-app/dist/css/app.css']
                        },
                        application: {
                            cwd: '<%= htmlPath %>',
                            files: [
                                '<%= htmlPathPrefix %>../shared/css/shared.css',
                                '<%= htmlPathPrefix %>css/application.css'
                            ]
                        }

                    }
                }

            },
            dist: {
                src: '<%= htmlPath %>/model.html',
                dest: '<%= htmlPath %>/index.html',
                options: {
                    beautify: true,
                    relative: false,
                    suffix: 'release=' + compileVersion,
                    scripts: {
                        core: {
                            cwd: '<%= htmlPath %>',
                            files: [
                                '<%= bowerPath %>/@phoenix/phoenix-app/dist/js/app.min.js'
                            ]
                        },
                        phoenix: {
                            cwd: '<%= htmlPath %>',
                            files: [
                                '<%= bowerPath %>/@phoenix/phoenix-cli/dist/js/phoenix.js',
                                '<%= bowerPath %>/@phoenix/phoenix-cli/dist/js/phoenix.widgets.min.js',
                                '<%= bowerPath %>/@phoenix/phoenix-cli/dist/js/phoenix.angular.min.js',
                                '<%= bowerPath %>/@phoenix/phoenix-cli/dist/js/phoenix.widgets.angular.min.js'
                            ]
                        },
                        jquery: {
                            cwd: '<%= htmlPath %>',
                            files: [
                                '//ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js',
                            ]
                        },
                        third_party: {
                            cwd: '<%= htmlPath %>',
                            files: [
                                '<%= bowerPath %>/es6-promise/dist/es6-promise.min.js',
                                '<%= bowerPath %>/popper.js/dist/umd/popper.js',
                                '<%= bowerPath %>/@phoenix/phoenix-cli/dist/bootstrap-theme/js/bootstrap.min.js',
                                '<%= bowerPath %>/ismobilejs/isMobile.min.js',
                                '<%= bowerPath %>/bootstrap-datepicker/dist/js/bootstrap-datepicker.js'
                            ]
                        },
                        angular: {
                            cwd: '<%= htmlPath %>',
                            files: [
                                '//ajax.googleapis.com/ajax/libs/angularjs/1.6.1/angular.min.js',
                                '//ajax.googleapis.com/ajax/libs/angularjs/1.6.1/angular-route.min.js'
                            ]
                        },
                        application_plugins: {
                            cwd: '<%= htmlPath %>',
                            files: [
                            ]
                        },
                        application_plugins_before: {
                            cwd: '<%= htmlPath %>',
                            files: [
                            ]
                        },
                        application: {
                            cwd: '<%= htmlPath %>',
                            files: [
                                '<%= htmlPathPrefix %>../shared/js/shared.min.js',
                                '<%= htmlPathPrefix %>application.min.js'
                            ]
                        }
                    },
                    styles: {
                        phoenix: {
                            cwd: '<%= htmlPath %>',
                            files: [
                                '<%= bowerPath %>/@phoenix/phoenix-cli/dist/css/phoenix.widgets.min.css',
                                '<%= bowerPath %>/@phoenix/phoenix-cli/dist/css/phoenix.min.css'
                            ]
                        },
                        phoenix_fonts: {
                            cwd: '<%= htmlPath %>',
                            files: [
                                '<%= bowerPath %>/@phoenix/phoenix-cli/dist/css/phoenix.fonts.min.css'
                            ]
                        },
                        third_party: {
                            cwd: '<%= htmlPath %>',
                            files: [
                                '<%= bowerPath %>/bootstrap-datepicker/dist/css/bootstrap-datepicker.css'

                            ]
                        },
                        application_plugins: {
                            cwd: '<%= htmlPath %>',
                            files: [
                            ]
                        },
                        core: {
                            cwd: '<%= htmlPath %>',
                            files: ['<%= bowerPath %>/@phoenix/phoenix-app/dist/css/app.min.css']
                        },
                        application: {
                            cwd: '<%= htmlPath %>',
                            files: [
                                '<%= htmlPathPrefix %>../shared/css/shared.min.css',
                                '<%= htmlPathPrefix %>css/application.min.css'
                            ]
                        }

                    }
                }

            }
        },


        clean: {
            lib: [
                '<%= distPath %>/shared'
            ],
            "lib-deploy": [
                '<%= releasePath %>/shared'
            ],
            before: [
                '<%= distPath %>/<%= application.name %>'
            ],
            temp: [
                '<%= tempPath %>',
                '<%= srcRootPath %>/<%= application.name %>/widgets/core',
                '<%= srcRootPath %>/<%= application.name %>/widgets/core/main-compiled.ts',
                '<%= distPath %>/<%= application.name %>/model.html'
            ],

            release: [
                '<%= releasePath %>/<%= application.name %>',
                '<%= releasePath %>/libs'
            ],
            bower: [
                '<%= rootPath %>/libs'
            ],
            dist: [
                '<%= releasePath %>/<%= application.name %>'
            ]
        }
    });
    grunt.registerTask('default', ['build']);

    grunt.registerTask('integrateDatasets', [], function () {
        var done = this.async();
        var application = grunt.config.get('application');
        var dsPath = grunt.config.get('srcRootPath') + '/' + application.name + '/ui/datasets/';
        var pagesPath = grunt.config.get('distPath') + '/' + application.name + '/ui/pages/';
        var srcPath = grunt.config.get('srcRootPath') + '/' + application.name + '/';
        initRootPath(grunt.config.get('srcRootPath'));
        dsutils.integrateDatasets(pagesPath, dsPath, function (err) {
            if (err)
                return grunt.fail.fatal(err);
            layoutUtils.integrateSubLayouts(application.name, pagesPath, srcPath, function (err) {
                if (err)
                    return grunt.fail.fatal(err);
                done();
            });
        });
    });

    grunt.registerTask('integrateSubForms', [], function () {
        var done = this.async();
        var application = grunt.config.get('application');
        var dsPath = grunt.config.get('srcRootPath') + '/' + application.name + '/ui/datasets/';
        var formsPath = grunt.config.get('distPath') + '/' + application.name + '/ui/forms/';
        var srcPath = grunt.config.get('srcRootPath') + '/' + application.name + '/';

        initRootPath(grunt.config.get('srcRootPath'));
        dsutils.integrateFormDatasets(formsPath, dsPath, function (err) {
            if (err)
                return grunt.fail.fatal(err);
            layoutUtils.integrateSubLayouts(application.name, formsPath, srcPath, function (err) {
                if (err)
                    return grunt.fail.fatal(err);

                done();
            });
        });
    });
    grunt.registerTask('mergeSchemas', [], function () {
        var done = this.async();
        var application = grunt.config.get('application');
        var schemasPath = grunt.config.get('distPath') + '/' + application.name + '/ui/forms/meta/';
        schemaUtils.mergeSchemas(schemasPath, function (err) {
            if (err)
                return grunt.fail.fatal(err);
            done();
        });
    });
    grunt.registerTask('createToolbox', [], function () {
        var done = this.async();
        var application = grunt.config.get('application');
        var toolboxFile = grunt.config.get('distPath') + '/' + application.name + '/ui/toolboxes/default.json';
        var phoenixPath = grunt.config.get('distPath') + '/libs/@phoenix/phoenix-cli/dist/js/';
        var widgetPath = grunt.config.get('srcRootPath') + '/' + application.name + '/widgets/';
        toolboxUtils.updateToolBoxFile(application.name, phoenixPath, widgetPath, toolboxFile, function (err) {
            if (err)
                return grunt.fail.fatal(err);
            done();
        });
    });




    grunt.registerTask('compile', ['clean:before', 'clean:temp', 'clean:dist', 'clean:release', 'copy:core', 'replace', 'ts:all', 'sass:application', 'ngtemplates', 'concat:application', 'uglify:application', 'cssmin:app', 'copy:app', 'copy-json-files']);

    grunt.registerTask('lib', ['clean:lib', 'ts:lib', 'sass:lib', 'copy:libimg', 'cssmin:lib', 'uglify:lib']);
    grunt.registerTask('lib-deploy', ['clean:lib', 'clean:lib-deploy', 'ts:lib', 'sass:lib', 'copy:libimg', 'cssmin:lib', 'uglify:lib', 'copy:lib-deploy']);

    grunt.registerTask('html-build', ['htmlbuild:debug', 'htmlbuild:dist', 'clean:temp']);
    grunt.registerTask('build-one', "Build one", function (moduleName) {
        _build(grunt, moduleName);
    });

    grunt.registerTask('copy-json-files', "Copy Json files", function () {
        var done = this.async();
        var application = grunt.config.get('application');
        var src = grunt.config.get('srcRootPath');
        src = path.join(src, application.name);
        var dst = grunt.config.get('distPath');
        dst = path.join(dst, application.name);
        let uidst = path.join(dst, 'ui')
        copyJsonFiles(src, path.join(dst, 'ui', 'locales'), path.join(uidst, 'forms'), path.join(uidst, 'pages'), path.join(uidst, 'forms', 'meta'), done);
    });

    grunt.registerTask('build', "Build task", function () {
        let done = this.async();
        let deploy = grunt.option('deploy');
        let ic = grunt.option('install-client');
        if (ic || deploy) {
            let tpl = grunt.config.get('third_party_libs');
            if (tpl && tpl.dependencies) {
                let deps = Object.keys(tpl.dependencies);
                if (deps.length) {
                    let cc = grunt.config.getRaw('copy');
                    list = cc.install_client.files[0].src;
                    deps.forEach(function (pkName) {
                        if (pkName === 'highcharts') {
                            list.push(pkName + '/highstock.js')
                            list.push(pkName + '/modules/data.js')
                        } else if (pkName === 'bootstrap-datepicker') {
                            list.push(pkName + '/dist/bootstrap-datepicker.js')
                            list.push(pkName + '/dist/bootstrap-datepicker.css')

                        } else list.push(pkName + '/**/*.*');
                    });
                    grunt.config.set('copy', cc);
                }
            }
            grunt.task.run('clean:bower');
            grunt.task.run('copy:install_client');
            if (!deploy) {
                done();
                return;
            }
        }

        var moduleName = grunt.option('module');
        if (moduleName) {
            grunt.task.run('build-one:' + moduleName);
            done();
        } else {
            var glbCfg = grunt.config.get('glbCfg');
            glbCfg.portailName = glbCfg.portailName || 'portail';
            grunt.config.set('glbCfg', glbCfg);
            grunt.task.run('htmlbuild:redirect-debug');
            grunt.task.run('htmlbuild:redirect-release');
            grunt.task.run('copy:app_config');
            if (deploy) {
                grunt.task.run('copy:deploy-root-index');
            }

            var mdSrc = grunt.config.get('srcRootPath');
            fs.readdir(mdSrc, function (err, files) {
                if (err) return done(err);
                grunt.task.run('build-one:shared');
                files.forEach(function (mn) {
                    if (mn === 'shared') return;
                    var stats = fs.statSync(mdSrc + "/" + mn);
                    if (stats.isDirectory())
                        grunt.task.run('build-one:' + mn);
                });
                done();
            });
        }

    });

};

