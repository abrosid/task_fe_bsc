var app = angular.module('test', ['ngRoute', 'pascalprecht.translate', 'ngResource'])
    .config(['$routeProvider', '$translateProvider', '$resourceProvider', 'LANG',
        function ($routeProvider, $translateProvider, $resourceProvider, LANG) {
            $resourceProvider.defaults.stripTrailingSlashes = false;
            $resourceProvider.defaults.actions = {
                create: { method: 'POST' },
                read: { method: 'GET' },
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT' },
                delete: { method: 'DELETE' }
            };
            $routeProvider
                .when('/posts', {
                    templateUrl: 'app/templates/posts.html',
                    controller: 'PostsCtrl'
                })
                .when('/post/:id', {
                    templateUrl: 'app/templates/post.html',
                    controller: 'PostCtrl'
                })
                .when('/create', {
                    templateUrl: 'app/templates/create.html',
                    controller: 'NewPost'
                })
                .otherwise('posts');

            $translateProvider
                .translations('en', LANG.EN)
                .translations('cz', LANG.CZ)
                .preferredLanguage('en')
                .useSanitizeValueStrategy('escape');
        }])
    .controller('MainCtrl', ['$rootScope', '$translate', '$timeout',
        function NotesCtrl($rootScope, $translate, $timeout) {
            $rootScope.title = 'Posts';
            $rootScope.lang = 'en';
            $rootScope.info = null;
            $rootScope.$watch('info', function (nv, ov) {
                $timeout(function () {
                    $rootScope.info = null;
                }, 2000);
            });
            $rootScope.cz = function () {
                $rootScope.lang = 'cz';
                $translate.use($rootScope.lang);
            };
            $rootScope.en = function () {
                $rootScope.lang = 'en';
                $translate.use($rootScope.lang);
            };
            $rootScope.q = '';

        }])
    .factory('PostFactory', ['$resource', '$rootScope', '$q', 'API_URL',
        function PostFactory($resource, $rootScope, $q, API_URL) {
            var posts = [];
            var rs = $resource(API_URL + '/:id', { id: '@id' });
            rs.getAll(function (res) {
                posts = res;
                $rootScope.$broadcast('updateList', posts);
            });

            return {
                getPosts: function () {
                    return posts;
                },
                create: function (p) {
                    return $q(function (resolve, reject) {
                        rs.create(p, function (res) {
                            resolve(res);
                        }, function (err) {
                            reject(err);
                        });
                    });
                },
                read: function (idp) {
                    return $q(function (resolve, reject) {
                        rs.read({ id: idp }, function (res) {
                            resolve(res);
                        }, function (err) {
                            reject(err);
                        });
                    });
                },
                update: function (p) {
                    return $q(function (resolve, reject) {
                        rs.update({ id: p.id }, p, function (res) {
                            resolve(res);
                        }, function (err) {
                            reject(err);
                        });
                    });
                },
                delete: function (idp) {
                    return $q(function (resolve, reject) {
                        rs.delete({ id: idp }, function (res) {
                            resolve(res);
                        }, function (err) {
                            reject(err);
                        });
                    });
                },
                completeDelete: function (id) {
                    for (var i = 0; i < posts.length; i++) {
                        if (posts[i].id == id) {
                            return posts.splice(i, 1);
                        }
                    }
                },
                completeSave: function (p) {
                    return posts.unshift(p);
                },
                getPost: function (id) {
                    for (var i = 0; i < posts.length; i++) {
                        if (posts[i].id == id) {
                            return posts[i];
                        }
                    }
                }
            };
        }])
    .controller('PostsCtrl', ['$scope', '$rootScope', '$timeout', '$translate', 'PostFactory',
        function PostsCtrl($scope, $rootScope, $timeout, $translate, PostFactory) {
            $scope.posts = PostFactory.getPosts();
            $scope.$on('updateList', function (e, posts) {
                $scope.posts = posts;
            });
            $scope.delete = function (idp) {
                $translate('CONFIRM_DELETE').then(function (txt) {
                    if (confirm(txt)) {
                        $scope.pending = true;
                        PostFactory.delete(idp).then(function (res) {
                            $scope.pending = false;
                            PostFactory.completeDelete(idp);
                            $rootScope.info = {
                                type: 'alert-success',
                                text: 'DELETE_SUCCESS'
                            };
                        }, function (err) {
                            $scope.pending = false;
                            $rootScope.info = {
                                type: 'alert-danger',
                                text: 'DELETE_ERROR'
                            };
                        });
                    }
                });
            };
        }])
    .controller('PostCtrl', ['$routeParams', '$scope', '$rootScope', '$location', '$translate', 'PostFactory',
        function PostCtrl($routeParams, $scope, $rootScope, $location, $translate, PostFactory) {
            $scope.post = PostFactory.getPost($routeParams.id);
            if (!$scope.post) {
                PostFactory.read($routeParams.id).then(function (res) {
                    $scope.post = res;
                }, function (err) {
                    $location.path('/posts');
                })
            }
            $scope.action = null;
            $scope.edit = function () {
                $scope.action = 'edit';
            };
            $scope.cancel = function () {
                $scope.action = null;
            };
            $scope.update = function () {
                $scope.pending = true;
                PostFactory.update($scope.post)
                    .then(function (res) {
                        $scope.action = null;
                        $scope.post = res;
                        $rootScope.info = {
                            type: 'alert-success',
                            text: 'UPDATE_SUCCESS'
                        };
                    }, function (err) {
                        $scope.action = null;
                        $rootScope.info = {
                            type: 'alert-danger',
                            text: 'UPDATE_ERROR'
                        };
                    });
            };
            $scope.delete = function () {
                $translate('CONFIRM_DELETE').then(function (txt) {
                    if (confirm(txt)) {
                        $scope.pending = true;
                        PostFactory.delete($routeParams.id).then(function (res) {
                            $scope.pending = false;
                            $scope.action = null;
                            $scope.post = res;
                            PostFactory.completeDelete($routeParams.id);
                            $rootScope.info = {
                                type: 'alert-success',
                                text: 'DELETE_SUCCESS'
                            };
                            $location.path('/posts');
                        }, function (err) {
                            $scope.pending = false;
                            alert(err.statusText);
                            PostFactory.completeDelete($routeParams.id);
                            $rootScope.info = {
                                type: 'alert-danger',
                                text: 'DELETE_ERROR'
                            };
                            $location.path('/posts');
                        });
                    }
                });

            };
        }])
    .controller('NewPost', ['$scope', '$rootScope', '$location', '$translate', 'PostFactory',
        function NewPost($scope, $rootScope, $location, $translate, PostFactory) {
            $scope.post = {
                id: null,
                title: '',
                body: '',
                userId: null
            };
            $scope.cancel = function () {
                $location.path('/posts');
            };
            $scope.create = function () {
                PostFactory.create($scope.post).then(function (res) {
                    $scope.post = res;
                    PostFactory.completeSave($scope.post);
                    $rootScope.info = {
                        type: 'alert-success',
                        text: 'CREATE_SUCCESS'
                    };
                    $location.path('/post/' + $scope.post.id);
                }, function (err) {
                    $rootScope.info = {
                        type: 'alert-danger',
                        text: 'CREATE_ERROR'
                    };
                });
            };

        }])
    .constant('API_URL', 'http://jsonplaceholder.typicode.com/posts')
    .constant('LANG', {
        EN: {
            'HOME': 'Home',
            'BACK': 'Back',
            'POSTS': 'Posts',
            'CREATE': 'Create',
            'READ': 'Read',
            'SAVE': 'Save',
            'CANCEL': 'Cancel',
            'EDIT': 'Edit',
            'DELETE': 'Delete',
            'UPDATE': 'Update',
            'TITLE': 'Title',
            'BODY': 'Body',
            'ENTER_TITLE': 'Enter title',
            'ENTER_BODY': 'Enter body',
            'SEARCH': 'search',
            'CONFIRM_DELETE': 'Do you really want to delete?',
            'CREATE_ERROR': 'There was an error creating the post.',
            'CREATE_SUCCESS': 'Post was created successfully.',
            'DELETE_ERROR': 'There was an error deleting the post.',
            'DELETE_SUCCESS': 'Post was deleted successfully.',
            'UPDATE_ERROR': 'There was an error updating the post.',
            'UPDATE_SUCCESS': 'Post was updated successfully.'
        },
        CZ: {
            'HOME': 'Hlavní',
            'BACK': 'Zpět',
            'POSTS': 'Příspěvky',
            'CREATE': 'Vytvořit',
            'READ': 'Číst',
            'SAVE': 'Uložit',
            'CANCEL': 'Zrušit',
            'EDIT': 'Upravit',
            'DELETE': 'Vymazat',
            'UPDATE': 'Aktualizovat',
            'TITLE': 'Název',
            'BODY': 'Obsah',
            'ENTER_TITLE': 'Zadejte název',
            'ENTER_BODY': 'Zadejte obsah',
            'SEARCH': 'hledání',
            'CONFIRM_DELETE': 'Opravdu chcete smazat?',
            'CREATE_ERROR': 'Při vytváření příspěvku došlo k chybě.',
            'CREATE_SUCCESS': 'Příspěvek byl úspěšně vytvořen.',
            'DELETE_ERROR': 'Při mazání příspěvku došlo k chybě.',
            'DELETE_SUCCESS': 'Příspěvek byl úspěšně smazán.',
            'UPDATE_ERROR': 'Při aktualizaci příspěvku došlo k chybě.',
            'UPDATE_SUCCESS': 'Příspěvek byl úspěšně aktualizován.'
        }
    });