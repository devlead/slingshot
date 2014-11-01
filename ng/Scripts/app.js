﻿/*\
|*|
|*|  IE-specific polyfill which enables the passage of arbitrary arguments to the
|*|  callback functions of JavaScript timers (HTML5 standard syntax).
|*|
|*|  https://developer.mozilla.org/en-US/docs/DOM/window.setInterval
|*|
|*|  Syntax:
|*|  var timeoutID = window.setTimeout(func, delay, [param1, param2, ...]);
|*|  var timeoutID = window.setTimeout(code, delay);
|*|  var intervalID = window.setInterval(func, delay[, param1, param2, ...]);
|*|  var intervalID = window.setInterval(code, delay);
|*|
\*/

if (document.all && !window.setTimeout.isPolyfill) {
  var __nativeST__ = window.setTimeout;
  window.setTimeout = function (vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */) {
    var aArgs = Array.prototype.slice.call(arguments, 2);
    return __nativeST__(vCallback instanceof Function ? function () {
      vCallback.apply(null, aArgs);
    } : vCallback, nDelay);
  };
  window.setTimeout.isPolyfill = true;
}

if (document.all && !window.setInterval.isPolyfill) {
  var __nativeSI__ = window.setInterval;
  window.setInterval = function (vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */) {
    var aArgs = Array.prototype.slice.call(arguments, 2);
    return __nativeSI__(vCallback instanceof Function ? function () {
      vCallback.apply(null, aArgs);
    } : vCallback, nDelay);
  };
  window.setInterval.isPolyfill = true;
}


(function () {

// app.js
// create our angular app and inject ngAnimate and ui-router 
// =============================================================================
angular.module('formApp', ['ngAnimate', 'ui.router'])

// configuring our routes 
// =============================================================================
.config(function($stateProvider, $urlRouterProvider) {
	
	$stateProvider
	
		// route to show our basic form (/form)
		.state('form', {
			url: '/form',
			templateUrl: 'ng/views/form.html',
			controller: 'FormController'
		})
		
		// nested states 
		// each of these sections will have their own view
		// url will be nested (/form/setup)
		.state('form.setup', {
			url: '/setup',
			templateUrl: 'ng/views/form-setup.html',
			controller: 'FormSetupController'

		})

		// /form/preview
		.state('form.preview', {
			url: '/preview',
			templateUrl: 'ng/views/form-preview.html',
			controller: 'FormPreviewController'

		})
		
		// /form/deploy
		.state('form.deploy', {
			url: '/deploy',
			templateUrl: 'ng/views/form-deploy.html',
			controller: 'FormDeployController'
		})
		
		// /form/payment
		.state('form.payment', {
			url: '/payment',
			templateUrl: 'ng/views/form-payment.html'
		});
		
	// catch all route
	// send users to the form page 
	$urlRouterProvider.otherwise('/form/setup');
})

// Custom filters
// =============================================================================
.filter('camelCaseToHuman', function(){
	return function(input) {
	    return input.charAt(0).toUpperCase() + input.substr(1).replace(/[A-Z]/g, ' $&');
  }
})

// our controller for the form
// =============================================================================
.controller('FormController', ['$scope', '$location', function($scope, $location) {
	
	// we will store all of our form data in this object
	$scope.formData = {};
	
	////////////////////
	// Private Methods
	////////////////////

	function initialize(){
		$scope.formData.repositoryUrl = getQueryVariable("repository");

		// if(!repositoryUrl || repositoryUrl.length === 0){
			// repositoryUrl = document.referrer;
			// if(!repositoryUrl || repositoryUrl.length === 0){
				// $scope.formData.error = "No repository detected.  The repository must be passed as either a referrer header or as a query string.";
			// }
		// }

		// When a user switches directories, we need to redirect to a different URL to update our token.
		// That will mess up the referrer header, so we check to make sure we don't set the repositoryUrl
		// to our own domain path.
		// var repository = parseURL(repositoryUrl);
		// if(repository.hostname !== location.hostname){
		// 	sessionStorage.repositoryUrl = repositoryUrl;
		// }

		if(!$scope.formData.repositoryUrl || $scope.formData.repositoryUrl.length === 0){
			if(sessionStorage.repositoryUrl){
				$scope.formData.repositoryUrl = sessionStorage.repositoryUrl;
			}
			else{
				$scope.formData.error = "No repository detected.  The repository must be passed as either a referrer header or as a query string.";				
			}
		}

		if($scope.formData.repositoryUrl){
			sessionStorage.repositoryUrl = $scope.formData.repositoryUrl;
		}

		$location.url("/");
	}

	function getQueryVariable(variable) {
	    var query = window.location.search.substring(1);
	    var vars = query.split('&');
	    for (var i = 0; i < vars.length; i++) {
	        var pair = vars[i].split('=');
	        if (decodeURIComponent(pair[0]) == variable) {
	            return decodeURIComponent(pair[1]);
	        }
	    }

	    return null;
	}

	function parseURL(url) {
	    var parser = document.createElement('a'),
	        searchObject = {},
	        queries, split, i;
	    
	    // Let the browser do the work
	    parser.href = url;
	    
	    // Convert query string to object
	    queries = parser.search.replace(/^\?/, '').split('&');
	    for( i = 0; i < queries.length; i++ ) {
	        split = queries[i].split('=');
	        searchObject[split[0]] = split[1];
	    }

	    return {
	        protocol: parser.protocol,
	        host: parser.host,
	        hostname: parser.hostname,
	        port: parser.port,
	        pathname: parser.pathname,
	        search: parser.search,
	        searchObject: searchObject,
	        hash: parser.hash
	    };
	}

	initialize();
}])

.controller('FormSetupController', ['$scope', '$http', function($scope, $http){
	var paramObject = function(){
		var that = {};
		that.name = null;
		that.type = null;
		that.allowedValues = null;
		that.aliasValues = null;
		that.defaultValue = null;
		that.value = null;
		return that;
	};

	function initialize($scope, $http){
		// If we don't have the repository url, then don't init.  Also
		// if the user hit "back" from the next page, we don't re-init.
		if(!$scope.formData.repositoryUrl || $scope.formData.repositoryUrl.length === 0 || $scope.formData.subscriptions){
			return;
		}

		$http({
		    method: "get",
		    url: "api/template",
		    params: {
		    	"repositoryUrl" : $scope.formData.repositoryUrl
		    }
		})
		.then(function(result){

			$scope.formData.template = result.data.template;
			$scope.formData.subscriptions = result.data.subscriptions;
			$scope.formData.siteLocations = result.data.siteLocations;
			$scope.formData.templateUrl = result.data.templateUrl;
			$scope.formData.branch = result.data.branch;
			$scope.formData.tenants = result.data.tenants;
			$scope.formData.repositoryUrl = result.data.repositoryUrl;

			// Select current tenant
			var tenants = $scope.formData.tenants;

			// For testing directory changes
			// var tenantCopy = {};
			// angular.copy(tenants[0], tenantCopy);
			// tenantCopy.DisplayName = "foo";
			// tenants.push(tenantCopy);

			for(var i = 0; i < tenants.length; i++){
				if(tenants[i].Current){
					$scope.formData.tenant = tenants[i];
				}
			}

			// Pull out template parameters to show on UI
			$scope.formData.params = [];
			var repoParamFound = false;
			var parameters = $scope.formData.template.parameters;
			for(var name in parameters){
				var parameter = parameters[name];
				var param = paramObject();
				
				param.name = name;
				param.type = parameter.type;
				param.allowedValues = parameter.allowedValues;
				param.defaultValue = parameter.defaultValue;

				$scope.formData.params.push(param);

				if(param.name.toLowerCase() === "repourl"){
					repoParamFound = true;
				}
			}

			if(!repoParamFound){
				$scope.formData.error = "Could not find a 'repoUrl' parameter in the template file."
			}

		},
		function(error){
			alert(error.statusText)
		});
	}

	// $scope.getRepositoryUrl = function(){
	// 	return sessionStorage.repositoryUrl;
	// }

	$scope.changeTenant = function(){
		var tenantUrl = window.location.origin + window.location.pathname + "api/tenants/" + $scope.formData.tenant.TenantId;
		window.location = tenantUrl;
	}

	$scope.showParam = function(param){
		if(!param.value){
			param.value = param.defaultValue;
		}

		var name = param.name.toLowerCase();
		if(name === 'repourl' && $scope.formData.repositoryUrl){
			param.value = $scope.formData.repositoryUrl;
			return false;
		}
		else if(name === 'branch'){
			param.value = $scope.formData.branch;
			return false;
		}
		else if(name === 'hostingplanname'){
			return false;
		}
		else if(name === 'workersize'){
			if(!param.aliased){
				param.aliased = true;

				// Creating aliases this way means that we need to undo them later.  There should be a better
				// way to get this to work with Angular's select box, but I couldn't get it to work so
				// for now this will have to do.
				param.allowedValues[0] = "Small";
				param.allowedValues[1] = "Medium";
				param.allowedValues[2] = "Large";
			}

			var skuParam = getParamByName($scope.formData.params, 'sku');
			if(skuParam &&
				(skuParam.value === 'Free' ||
			    skuParam.value === 'Shared')){
					param.value = 'Small';
					return false;
			}
		}

		return true;
	}

	function getParamByName(params, name){
		for(var i = 0; i < params.length; i++){
			if(params[i].name.toLowerCase() === name.toLowerCase()){
				return params[i];
			}
		}

		return null;
	}

	$scope.canMoveToNextStep = function(){
		if($scope.formData.tenant &&
		   $scope.formData.subscription &&
		   $scope.formData.params &&
		   $scope.formData.siteNameAvailable){
			var params = $scope.formData.params;
			for(var i = 0; i < params.length; i++){

				if(params[i].name === 'hostingPlanName' && $scope.formData.siteName){
					params[i].value = $scope.formData.siteName;
				}				

				if(params[i].value === null){
					return false;
				}
			}

			return true;
		}

		return false;
	}

	$scope.checkSiteName = function(siteName){
		if(siteName){
			$scope.formData.siteNameQuery = siteName;
			window.setTimeout(querySiteName, 250, $scope, $http, siteName);
		}
		else{
			$scope.formData.siteNameAvailable = false;
			$scope.formData.siteName = '';
		}
	}

	$scope.showSiteNameAvailableMesg = function(){
		if(($scope.formData.siteName && $scope.formData.siteName.length > 0) &&
		   ($scope.formData.siteNameQuery && $scope.formData.siteNameQuery.length > 0)){
			return true;
		}

		return false;
	}

	$scope.nextStep = function(){
		$scope.formData.deployPayload = getDeployPayload($scope.formData.params);
	}

	function querySiteName($scope, $http, siteName){
		// Check to make sure we still have the correct site name to query after the delay
		if($scope.formData.siteNameQuery === siteName){
			var subscriptionId = $scope.formData.subscriptions[1].subscriptionId
			$http({
			    method: "get",
			    url: "api/subscriptions/"+subscriptionId+"/sites/"+siteName
			})
			.then(function(result){
				// After getting the result, double check to make sure that the
				// sitename we queried still matches what the user has typed in
				if(result.data.siteName === $scope.formData.siteNameQuery){
					$scope.formData.siteNameAvailable = result.data.isAvailable;
					$scope.formData.siteName = result.data.siteName;
				}
			},function(result){
				alert(result.statusText);
			});
		}
	}

	function getDeployPayload(params){
		var dataParams = {}
		for(var i = 0; i < params.length; i++){
			var param = params[i];

			// Since we tranformed workersize to pretty values earlier, we need to convert them back
			if(param.name.toLowerCase() === "workersize"){
				param.value = param.allowedValues.indexOf(param.value).toString();
			}
			
			// JavaScript may convert string representations of numbers incorrectly
			if(typeof param.value === "number" && param.type.toLowerCase() === 'string'){
				param.value = param.value.toString();
			}

			dataParams[param.name] = {value : param.value};
		}

		return dataParams;
	}

	initialize($scope, $http);

}]) // end FormSetupController

.controller('FormPreviewController', ['$scope', '$http', function($scope, $http){
	function initialize($scope, $http){
		var subscriptionId = $scope.formData.subscription.subscriptionId;

		$http({
		    method: "post",
		    url: "api/preview/"+subscriptionId,
		    params:{
		    	"templateUrl" : $scope.formData.templateUrl,
		    },
		    data: $scope.formData.deployPayload
		})
		.then(function(result){
			$scope.formData.providers = result.data.providers;
		},
		function(result){
			alert("Failed to preview");
		});
	}

	initialize($scope, $http);
}]) // end FormPreviewController

.controller('FormDeployController', ['$scope', '$http', function($scope, $http){
	$scope.formData.statusMesgs = [];

	$scope.showError = function(){
		$('#errorModal').modal('show');
	}

	function initialize($scope, $http){
		var subscriptionId = $scope.formData.subscription.subscriptionId;

		$scope.formData.statusMesgs.push("Submitting Deployment...");
		$http({
		    method: "post",
		    url: "api/deployments/"+subscriptionId,
		    params:{
		    	"templateUrl" : $scope.formData.templateUrl,
		    },
		    data: $scope.formData.deployPayload
		})
		.then(function(result){
			$scope.formData.statusMesgs.push("Deployment Started...");
			window.setTimeout(getStatus, 10000, $scope, $http);
		},
		function(result){
			$scope.formData.errorMesg = result.data.error;
		});
	}

	function getStatus($scope, $http, deploymentUrl){
		var subscriptionId = $scope.formData.subscription.subscriptionId;
		var siteName = $scope.formData.siteName;

		$http({
		    method: "get",
		    url: "api/deployments/"+subscriptionId+"/sites/"+siteName
 		})
		.then(function(result){
			if(result.data.provisioningState === "Failed"){
				// etodo: add better error
				$scope.formData.errorMesg = "Failed";
			}
			else if(result.data.provisioningState === "Succeeded"){
				// $scope.formData.statusMesgs.push("Deployment Complete.");
				$scope.formData.siteUrl = result.data.siteUrl;
				window.setTimeout(getGitStatus, 1000, $scope, $http);

			}
			else{
				if(!$scope.formData.waitingForDeployment){
					$scope.formData.statusMesgs.push("Creating Azure Resources...");	
					$scope.formData.waitingForDeployment = true;
				}
				window.setTimeout(getStatus, 1000, $scope, $http);
			}
		},
		function(result){
			$scope.formData.errorMesg = result.data.error;
		});
	}

	function getGitStatus($scope, $http){
		var subscriptionId = $scope.formData.subscription.subscriptionId;
		var siteName = $scope.formData.siteName;

		$http({
		    method: "get",
		    url: "api/deployments/"+subscriptionId+"/sites/"+siteName+"/git"
 		})
		.then(function(result){
			var formData = $scope.formData;
			if(result.data.status === 4){
				formData.deploymentSucceeded = true;
			}
			else if(result.data.status === 3){
				formData.errorMesg = "Git deployment failed";	
			}
			else{
				if(formData.statusMesgs[formData.statusMesgs.length-1] !== result.data.status_text){
					formData.statusMesgs.push(result.data.status_text);
				}
				window.setTimeout(getGitStatus, 1000, $scope, $http);
			}
		},
		function(result){
			$scope.formData.errorMesg = result.data.error;
		});

	}

	initialize($scope, $http);

}]);  // end FormDeployController


})();
