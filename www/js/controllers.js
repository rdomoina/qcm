angular.module('starter.controllers', [])


	.controller('CategoryCtrl', ['$scope', 'CategoryFactory', 'FirebaseQueryFactory', '$q', '$state', 'LoginService', '$ionicLoading', '$ionicActionSheet', function ($scope, CategoryFactory, FirebaseQueryFactory, $q, $state, LoginService, $ionicLoading, $ionicActionSheet) {
		CategoryFactory.getAllCategory().then(function (catList) {
			$scope.allCategories = catList;
			console.log(catList);
		});

		function generateQCM(selectedItem) {
			const deffered = $q.defer();

			FirebaseQueryFactory.getQuestionsByCategory(selectedItem.id).then((questionList) => {
				if (questionList.length) {
					return FirebaseQueryFactory.getReponsesByQuestionIds(questionList)
						.then(function (responseList) {
							const resp = responseList.reduce((acc, rep) => {
								const key = Object.keys(rep)[0];
								const arr = rep[key];

								acc[key] = arr;
								return acc;
							}, {});

							const data = {};

							data.category = selectedItem.value;
							data.questions = [];

							questionList.map((question) => {
								const dataQuestion = {};

								dataQuestion.value = question.value;
								dataQuestion.responses = resp[question.id];
								data.questions.push(dataQuestion);
							});

							deffered.resolve(data);
							$scope.getQuestion = [];
							$scope.getQuestion = data.questions[0].value;
							console.log('resultat :');
							console.log(data.questions[0].value);

							/*console.log('réponse :');
							console.log(data.questions[0].responses);*/
						});
				}
			});

			return deffered.promise;
		}
		function doLogout() {
			var hideSheet = $ionicActionSheet.show({
				destructiveText: 'Déconnecter',
				titleText: 'Êtes-vous sûr de vouloir vous déconnecter?',
				cancelText: 'Annuler',
				cancel: function () { },
				buttonClicked: function (index) {
					return true;
				},
				destructiveButtonClicked: function () {
					$ionicLoading.show({
						template: '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>'
					})
					facebookConnectPlugin.logout(function () {
						$ionicLoading.hide();
						console.log("Logged out");
						$state.go('tab.login');
					}, function (fail) {
						$ionicLoading.hide();
						console.log("Failed Logged out");
					});
				}
			});
		}
		$scope.onSelectCategoryChange = function (selectedItem) {
			generateQCM(selectedItem).then((data) => {
				console.log(data);
				FirebaseQueryFactory.setData(data);
				$state.go('tab.qcm');
			});
		};
		console.log('Nom :' + LoginService.getName());
		$scope.name = LoginService.getName();
		$scope.image = LoginService.getImage();
		$scope.friendsCount = LoginService.getNbAmie();
		$scope.firstName = LoginService.getFirstName();
		$("#doLogout").on('click', doLogout);
	}])

	.controller('LoginCtrl', ['$scope', 'LoginFactory', '$state', '$ionicLoading', '$ionicModal', 'LoginService', function ($scope, LoginFactory, $state, $ionicLoading, $ionicModal, LoginService) {


		$scope.loginData = {};
		$ionicModal.fromTemplateUrl('templates/tab-login.html', {
			scope: $scope
		}).then(function (modal) {
			$scope.modal = modal;
		});
		$scope.closeLogin = function () {
			$scope.modal.hide();
		};

		$scope.login = function () {
			$scope.modal.show();
		};
		function toggleSignIn() {
			$ionicLoading.show({
				template: '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>'
			});

			console.log("dans la fonction toggleSignIn");
			if (firebase.auth().currentUser) {
				// [START signout]
				firebase.auth().signOut();
				// [END signout]
			} else {
				var email = document.getElementById('email').value;
				var password = document.getElementById('password').value;
				if (email.length < 4) {
					alert('Please enter an email address.');
					return;
				}
				if (password.length < 4) {
					alert('Please enter a password.');
					return;
				}
				firebase.auth().signInWithEmailAndPassword(email, password).catch(function (error) {
					var errorCode = error.code;
					var errorMessage = error.message;
					if (errorCode === 'auth/wrong-password') {
						alert('Wrong password.');
						$ionicLoading.hide();
					} else {
						alert(errorMessage);
						$ionicLoading.hide();
					}
					console.log(error);
					document.getElementById('quickstart-sign-in').disabled = false;
				});
			}
			document.getElementById('quickstart-sign-in').disabled = true;
			console.log("veeeeeee");
			firebase.auth().onAuthStateChanged(function (user) {
				// [END_EXCLUDE]
				if (user) {
					// User is signed in.
					var displayName = user.displayName;
					var email = user.email;
					var emailVerified = user.emailVerified;
					var photoURL = user.photoURL;
					var isAnonymous = user.isAnonymous;
					var uid = user.uid;
					var providerData = user.providerData;
					// [START_EXCLUDE]
					console.log("vous etes connecter");

					$state.go('tab.cat');
					$ionicLoading.hide();
					// [END_EXCLUDE]
				} else {
					// User is signed out.
					// [START_EXCLUDE]

					document.getElementById('quickstart-sign-in').textContent = 'Se connecter';

				}
				document.getElementById('quickstart-sign-in').disabled = false;
			});

			document.getElementById('quickstart-sign-in').addEventListener('click', toggleSignIn, false);

		}

		function getFriendsIsConnected() {

		}
		function doLogin() {

			console.log('Doing login');
			facebookConnectPlugin.login(['email', 'public_profile', 'user_friends'],
				function (response) {
					console.log('successefully logged is ' + JSON.stringify(response));
					console.log('conneccté sa tsi : ' + response.status);


					var authResponse = response.authResponse;
					facebookConnectPlugin.api("/me?fields=id,email,taggable_friends,friends,birthday,picture.type(large),first_name,last_name,name&access_token=" + authResponse.accessToken, null,
						function (profileInfo) {
							console.log('successefully fetched in ' + JSON.stringify(profileInfo));
							$scope.username = profileInfo.name;
							$scope.friendsIsActif = profileInfo.taggable_friends.data;
							$scope.friendsCount = profileInfo.friends.summary.total_count;
							$scope.first_name = profileInfo.first_name;
							LoginService.setName($scope.username);
							$scope.firiendsIsConnected = "https://graph.facebook.com/" + authResponse.userID + "/friends?fields=installed"
							$scope.userPicUrl = "https://graph.facebook.com/" + authResponse.userID + "/picture?type=large";
							console.log(JSON.stringify(profileInfo));
							LoginService.setImage(($scope.userPicUrl));
							LoginService.setNbAmie(($scope.friendsCount));
							LoginService.setFirstName(($scope.first_name));
							LoginService.setFriendsIsActif($scope.friendsIsActif);
							console.log(JSON.stringify($scope.firiendsIsConnected));
							$state.go('tab.cat');
						},
						function (fail) {
							console.log(fail);
						});
				},
				function (error) {
					console.log(error);
				}

			);
		}
		$("#quickstart-sign-in").on('click', toggleSignIn);
		$("#doLogin").on('click', doLogin);
	}])

	.controller('BaremCtrl', ['$scope', 'LoginService', 'PointService', function ($scope, LoginService, PointService) {
		$scope.totalBareme = 0;
		$scope.reponseFaux = PointService.getPoint();
		$scope.reponseVrai = PointService.getBonneReponse();
		$scope.tailleQuestion = PointService.getTailleQuestion();
		$scope.firstName = LoginService.getFirstName();
		$scope.friendsIsActif = LoginService.getFriendsIsActif();
		$scope.toggleGroup = function (group) {
			if ($scope.isGroupShown(group)) {
				$scope.shownGroup = null;
			} else {
				$scope.shownGroup = group;
			}
		};
		$scope.isGroupShown = function (group) {
			return $scope.shownGroup === group;
		};
		function share() {

			FB.ui({
				method: 'share',
				display: 'popup',
				href: 'https://github.com/rdomoina/qcmApp',
			}, function (response) { });
		};

		function invite() {
			console.log('Hay n Tompo');

			FB.ui({
				method: 'apprequests',
				title: 'Découvrez cette superbe application!',
				message: 'Je vous invite a télecharger cet application!!!',
				display: 'popup'
			}, function requestCallback(response) {
				console.log(response);
			});

		};

		$("#doShare").on('click', share);
		$("#doInvite").on('click', invite);

	}])

	.controller("QcmCtrl", ['$scope',
		'FirebaseQueryFactory',
		'$rootScope',
		'$ionicLoading',
		'$state',
		'PointService',
		function ($scope, FirebaseQueryFactory, $rootScope, $ionicLoading, $state, PointService) {
			const data = FirebaseQueryFactory.getData();
			var json;
			var compter = 0;
			var radom = Math.floor(Math.random() * data.questions.length);
			$ionicLoading.show({
				template: '<div class="loader"><svg class="circular"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>'
			});
			$scope.temp = [];
			$scope.bareme = 0;
			$scope.totalBareme = 0;
			$scope.reponseFaux = 0;
			$scope.reponseVrai = 0;

			function precedent() {
				$scope.questionList = data.questions;
				json = data;
				if (compter < json.questions.length) {
					document.getElementById("questionEncours").innerHTML = "<label class='label label-default'>Question : </label>" + json.questions[compter].value;
					document.getElementById("button").innerHTML = "<nav aria-label='navigation'><ul class='pager'><li class='previous'><a title='Précédent' id='precedent'>Précédent</a></li><li class='next'><a title='Suivant' id='suivant'>Suivant</a></li></ul></nav>";
					document.getElementById("reponsesList").innerHTML = "";
					for (var i = 0; i < json.questions[compter].responses.length; i++) {
						var contentInput = json.questions[compter].responses[i].value;
						var span = document.createElement('span');
						var att = document.createAttribute('class');
						att.value = 'row';
						span.setAttributeNode(att);
						span.innerHTML = ['<div><input type="radio" id="reponse" value=', json.questions[compter].responses[i].isTrue, '  name="radio"></div> ', contentInput].join('');
						document.getElementById("reponsesList").insertBefore(span, null);

					}
					compter--;
					$("#precedent").on('click', precedent);
					$(".row").on('click', insert);
					$("#suivant").one('click', insert);
				}
			}
			function insert() {

				if ($('input[name=radio]:checked').val() == 'true') {
					console.log("bravo!!!" + $('input[name=radio]:checked').val());
					$scope.bareme = $scope.bareme + 1;
					$scope.reponseVrai = $scope.reponseVrai + 1;
				} else if ($('input[name=radio]:checked').val() == 'false') {
					$scope.reponseFaux = $scope.reponseFaux + 1;
					console.log("Vous etes null!!" + $('input[name=radio]:checked').val());
				}
				PointService.setPoint($scope.reponseFaux);
				PointService.setBonneReponse($scope.reponseVrai);
				console.log('reponse vraie : ' + $scope.reponseVrai);
				console.log('reponse fausse : ' + $scope.reponseFaux);
				console.log('reponse total point : ' + $scope.bareme);

				$scope.questionList = data.questions;
				PointService.setTailleQuestion(data.questions.length);
				json = data;
				if (compter < json.questions.length) {

					document.getElementById("questionEncours").innerHTML = "<label class='label label-default'>Question : </label>" + json.questions[compter].value;
					document.getElementById("button").innerHTML = "<nav aria-label='navigation'><ul class='pager'><li class='previous'><a title='Précédent' id='precedent'>Précédent</a></li><li class='next'><a title='Suivant' id='suivant'>Suivant</a></li></ul></nav>";
					document.getElementById("reponsesList").innerHTML = "";
					for (var i = 0; i < json.questions[compter].responses.length; i++) {
						var contentInput = json.questions[compter].responses[i].value;
						var span = document.createElement('span');
						var att = document.createAttribute('class');
						att.value = 'row';
						span.setAttributeNode(att);
						span.innerHTML = ['<div><input type="radio" id="reponse" value=', json.questions[compter].responses[i].isTrue, '  name="radio"></div> ', contentInput].join('');
						document.getElementById("reponsesList").insertBefore(span, null);

					}

					compter++;
					$("#precedent").on('click', precedent);
					$(".row").on('click', insert);
					$("#suivant").one('click', insert);


				}
				else {
					console.log("Y a plus de question");
					$state.go('tab.resultat');
					console.log("Changement de page");
				}

			};

			if (data.category) {
				console.log("il y en a des catégories ");
				$ionicLoading.hide();


				$("#demarre").click(function () {
					var boutton = document.getElementById('demarre').innerHTML = 'Pause';
					var att = document.createAttribute("class");
					att.value = "pause";
					drawCanvas();
					$scope.questionList = data.questions;
					json = data;
					document.getElementById("questionEncours").innerHTML = "<label class='label label-default'>Question :</label> " + json.questions[compter].value;
					document.getElementById("timing").innerHTML = "<label><i class='glyphicon glyphicon-time'></i> Temps restant :</label>";
					document.getElementById("button").innerHTML = "<nav aria-label='navigation'><ul class='pager'><li class='previous disabled'><a title='Précédent' id='precedent'>Précédent</a></li><li class='next'><a title='Suivant' id='suivant'>Suivant</a></li></ul></nav>";
					var input = "";
					document.getElementById("reponsesList").innerHTML = "";
					for (var i = 0; i < json.questions[compter].responses.length; i++) {
						var contentInput = json.questions[compter].responses[i].value;
						var span = document.createElement('span');
						var att = document.createAttribute('class');
						att.value = 'row';
						span.setAttributeNode(att);
						span.innerHTML = ['<div id="input"><input type="radio"  value=', json.questions[compter].responses[i].isTrue, ' name="radio"></div> ', contentInput].join('');
						document.getElementById("reponsesList").insertBefore(span, null)


					}

					compter++;
					$("#suivant").one('click', insert);
					$(".row").one('click', insert);

				});
				$(".pause").one('click', function () {
					console.log('On est Pause');
				});

			}


		}]);


