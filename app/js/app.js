var app = angular.module('test', ['ui.router', 'pascalprecht.translate', 'ngResource'])
    .config(['$locationProvider', '$urlRouterProvider', '$stateProvider', '$translateProvider', '$resourceProvider', 'LANG',
        function ($locationProvider, $urlRouterProvider, $stateProvider, $translateProvider, $resourceProvider, LANG) {
            $locationProvider.hashPrefix('');
            $resourceProvider.defaults.stripTrailingSlashes = false;
            $resourceProvider.defaults.actions = {
                create: { method: 'POST' },
                read: { method: 'GET' },
                getAll: { method: 'GET', isArray: true },
                update: { method: 'PUT' },
                delete: { method: 'DELETE' }
            };

            $stateProvider
                .state({
                    name: 'posts',
                    url: "/posts",
                    component: 'postList'
                })
                .state({
                    name: 'post',
                    url: "/post/:id",
                    component: 'postItem'

                })
                .state({
                    name: 'create',
                    url: "/create",
                    component: 'postForm'

                })
                .state({
                    name: 'edit',
                    url: "/edit/:id",
                    component: 'postEdit'

                });
            $urlRouterProvider.otherwise('/posts');

            $translateProvider
                .translations('en', LANG.EN)
                .translations('cz', LANG.CZ)
                .preferredLanguage('en')
                .useSanitizeValueStrategy('escape');
        }])
    .component('postList', {
        templateUrl: 'app/templates/posts.html',
        controller: 'PostsCtrl'
    })
    .component('postItem', {
        templateUrl: 'app/templates/post.html',
        controller: 'PostCtrl'
    })
    .component('postForm', {
        templateUrl: 'app/templates/create.html',
        controller: 'NewPost'
    })
    .component('postEdit', {
        templateUrl: 'app/templates/edit.html',
        controller: 'PostCtrl'
    }).controller('MainCtrl', ['$rootScope', '$translate', '$timeout',
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
    .controller('PostCtrl', ['$stateParams', '$scope', '$rootScope', '$state', '$translate', 'PostFactory',
        function PostCtrl($stateParams, $scope, $rootScope, $state, $translate, PostFactory) {
            $scope.post = PostFactory.getPost($stateParams.id);
            if (!$scope.post) {
                PostFactory.read($stateParams.id).then(function (res) {
                    $scope.post = res;
                }, function (err) {
                    $state.go('posts');
                })
            }
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
                        $state.go('post', { id: $stateParams.id });
                    }, function (err) {
                        $scope.action = null;
                        $rootScope.info = {
                            type: 'alert-danger',
                            text: 'UPDATE_ERROR'
                        };
                        $state.go('post', { id: $stateParams.id });
                    });
            };
            $scope.delete = function () {
                $translate('CONFIRM_DELETE').then(function (txt) {
                    if (confirm(txt)) {
                        $scope.pending = true;
                        PostFactory.delete($stateParams.id).then(function (res) {
                            $scope.pending = false;
                            $scope.action = null;
                            $scope.post = res;
                            PostFactory.completeDelete($stateParams.id);
                            $rootScope.info = {
                                type: 'alert-success',
                                text: 'DELETE_SUCCESS'
                            };
                            $state.go('posts');
                        }, function (err) {
                            $scope.pending = false;
                            alert(err.statusText);
                            PostFactory.completeDelete($stateParams.id);
                            $rootScope.info = {
                                type: 'alert-danger',
                                text: 'DELETE_ERROR'
                            };
                            $state.go('post', { id: $stateParams.id });
                        });
                    }
                });

            };
        }])
    .controller('NewPost', ['$scope', '$rootScope', '$state', '$translate', 'PostFactory',
        function NewPost($scope, $rootScope, $state, $translate, PostFactory) {
            $scope.post = {
                id: null,
                title: '',
                body: '',
                userId: null
            };
            $scope.cancel = function () {
                $state.go('posts');
            };
            $scope.create = function () {
                PostFactory.create($scope.post).then(function (res) {
                    $scope.post = res;
                    PostFactory.completeSave($scope.post);
                    $rootScope.info = {
                        type: 'alert-success',
                        text: 'CREATE_SUCCESS'
                    };
                    $state.go('post', { id: $scope.post.id });
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