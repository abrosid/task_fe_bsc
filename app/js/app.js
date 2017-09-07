var app = angular.module('test', ['ngRoute', 'pascalprecht.translate'])
        .config(['$routeProvider', '$translateProvider', function ($routeProvider, $translateProvider) {
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

                $translateProvider.translations('en', {
                    'PAGE': 'Posts',
                    'CREATE': 'Create',
                    'SAVE': 'Save',
                    'CANCEL': 'Cancel',
                    'EDIT': 'Edit',
                    'DELETE': 'Delete',
                    'UPDATE': 'Update',
                    'TITLE': 'Title',
                    'BODY': 'Body',
                    'ENTER_TITLE': 'Enter title',
                    'ENTER_BODY': 'Enter body',
                    'SEARCH_TITLE': 'search by title',
                    'SEARCH_BODY': 'search by body'

                });
                $translateProvider.translations('cz', {
                    'PAGE': 'Příspěvky',
                    'CREATE': 'Vytvořit',
                    'SAVE': 'Uložit',
                    'CANCEL': 'Zrušit',
                    'EDIT': 'Upravit',
                    'DELETE': 'Vymazat',
                    'UPDATE': 'Aktualizovat',
                    'TITLE': 'Název',
                    'BODY': 'Obsah',
                    'ENTER_TITLE': 'Zadejte název',
                    'ENTER_BODY': 'Zadejte obsah',
                    'SEARCH_TITLE': 'hledání podle názvu',
                    'SEARCH_BODY': 'vyhledávání podle obsahu'
                });
                $translateProvider.preferredLanguage('en');
            }])
        .controller('MainCtrl', ['$rootScope', '$translate', function NotesCtrl($rootScope, $translate) {
                $rootScope.title = 'Posts';
                $rootScope.lang = 'en';
                $rootScope.cz = function () {
                    $rootScope.lang = 'cz';
                    $translate.use($rootScope.lang);
                };
                $rootScope.en = function () {
                    $rootScope.lang = 'en';
                    $translate.use($rootScope.lang);
                };
                $rootScope.q = {
                    title: '',
                    body: ''
                };
                $rootScope.clear = function () {
                    $rootScope.q = {
                        title: '',
                        body: ''
                    };
                };
            }])
        .factory('PostFactory', ['$http', '$rootScope', 'API_URL', function PostFactory($http, $rootScope, API_URL) {
                var posts = [];
                $http.get(API_URL).then(function (res) {
                    posts = res.data;
                    $rootScope.$broadcast('updatePosts', posts);
                }, function (err) {
                    console.dir(err);
                    posts = [];
                });
                return {
                    setPosts: function (l) {
                        posts = l;
                    },
                    getPosts: function () {
                        return posts;
                    },
                    savePost: function (p) {
                        return $http.post(API_URL, {
                            title: p.title,
                            body: p.body,
                            userId: p.userId
                        });
                    },
                    updatePost: function (p) {
                        return $http.patch(API_URL+'/' + p.id, {
                            title: p.title,
                            body: p.body
                        });
                    },
                    deletePost: function (id) {
                        return $http.delete(API_URL+'/' + id);
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
        .controller('PostsCtrl', ['$scope', '$timeout', 'PostFactory', function PostsCtrl($scope, $timeout, PostFactory) {
                $scope.posts = PostFactory.getPosts();
                $scope.$on('updatePosts', function (e, posts) {
                    $scope.posts = posts;
                });
            }])
        .controller('PostCtrl', ['$routeParams', '$scope', '$location', 'PostFactory', function PostCtrl($routeParams, $scope, $location, PostFactory) {
                $scope.post = PostFactory.getPost($routeParams.id);
                if (!$scope.post) {
                    $location.path('/posts');
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
                    PostFactory.updatePost($scope.post).then(function (res) {
                        $scope.pending = false;
                        $scope.action = null;
                        $location.path('/posts');
                    }, function (err) {
                        $scope.pending = false;
                        alert(err.statusText);
                        $location.path('/posts');
                    });
                };
                $scope.delete = function () {
                    $scope.pending = true;
                    PostFactory.deletePost($routeParams.id).then(function (res) {
                        $scope.pending = false;
                        $scope.action = null;
                        PostFactory.completeDelete($routeParams.id);
                        $location.path('/posts');
                    }, function (err) {
                        $scope.pending = false;
                        console.dir(err);
                        alert(err.statusText);
                        PostFactory.completeDelete($routeParams.id);
                        $location.path('/posts');
                    });

                };
            }])
        .controller('NewPost', ['$scope', '$location', 'PostFactory', function NewPost($scope, $location, PostFactory) {
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
                    PostFactory.savePost($scope.post).then(function (res) {
                        if (res.data && res.statusText == 'Created') {
                            $scope.post = res.data;
                            PostFactory.completeSave($scope.post);
                            $location.path('/posts');
                        } else {
                            alert('Create error!');
                        }
                    });
                };

            }])
        .constant('API_URL', 'http://jsonplaceholder.typicode.com/posts');