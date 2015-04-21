var myapp = angular.module('myapp', []);

//////////////////////////////////////////////////////

myapp.controller('MainCtrl', ['$scope', '$http', function ($scope, $http) {
    
    $scope.phase = 0;
    $scope.info = {};
    var chrCode = {};

    (function loadChrDup(){
        $http.get('localAsset/chrLibDupCode.dat').
              success(function(data, status, headers, config) {
                console.log("loadChrDup Success!");
                chrCode.dup = eval(data);
              }).
              error(function(data, status, headers, config) {
                console.log("loadChrDup fail!");
              });
    })();
    
    $scope.showContent = function($file){
        $scope.file = $file;
        
        if( phase2validate() && $scope.file ){
            $scope.phase = 2;
        } else {
            $scope.phase = 1;
        }
    };

    $scope.saveFile = function(){
        $scope.phase = 4;
        return true;
    };

    function replaceChr(chrSets, myText){
        _.each( chrSets, function(elem){
            myText = myText.gsub( elem[0], elem[1] )     
        })    
        return myText;
    }
    
    function makeFileLink(content) {
    
        var blob = new Blob([content], { type:"text;charset=utf-8;" });
        return (window.URL || window.webkitURL).createObjectURL( blob );
    
	}; //http://stackoverflow.com/questions/16514509/how-do-you-serve-a-file-for-download-with-angularjs-or-javascript

    $scope.chageFilename = function(newFilename){
        $('#saveFile').attr('download', newFilename);
    }
    
    function validateArray( arr ){
        
        var pairs = 0;
        var _arr = _.zip.apply( this, arr );
        var its = _.intersection( _arr[0], _arr[1] ); 
        var warning = [];
        console.log("intersection element : ") ; console.log(its);
        
        for(var i=0, e; e=its[i]; i++){
            var beforeIdx = _arr[0].indexOf(e);
            var afterIdx = _arr[1].indexOf(e);

            if ( beforeIdx < afterIdx ){
                warning.push( e );
                pairs += 1;
                arr[beforeIdx][3] = pairs;
                arr[afterIdx][3] = pairs;
            }
        }
        
        if ( warning.length > 0) {
            return confirm( "Your Array might have loop, continue?\ncheck out elements below!\n" + warning.toString() );
        }
        
        return true;
    }
    
    function phase2validate(){
        return $scope.wordsets instanceof Array && ($scope.wordsets.length > 0) && ($scope.wordsets[0].length === 2)
    }
    
    $scope.getMyWordsets = function(event){
            $scope.wordsets = eval( replaceChr( chrCode.dup, $scope.myWordsets ) ); // 이중코드 병합
        
            if( phase2validate() && validateArray( $scope.wordsets ) && $scope.file){
                $scope.phase = 2;
            } else {
                $scope.phase = 1;
            }
    };
    
    $scope.convert = function(filename){
        
        $scope.info.replaceTimes = 0;
        var tmp = replaceChr( chrCode.dup, $scope.file.content ); // 이중코드 병합
        var arr = $scope.wordsets;

        for(var i=0, a; a=arr[i]; i++){
            a[2] = 0;
            a[2] = tmp.matchCount(a[0]);  //exString            
            tmp = tmp.gsub(a[0], a[1]);

            console.log(a[0] + ": " + a[2])
            $scope.info.replaceTimes += a[2];
        }
        
        $scope.converted_content = tmp;
        $scope.url = makeFileLink($scope.converted_content);
        
        $scope.phase = 3;
    }

    $scope.init = function(opt){
        delete $scope.converted_content;
        $scope.info = {};
        
        if(opt==='wordsets'){
            delete $scope.myWordsets; delete $scope.wordsets
            $scope.phase = $scope.file ? 1 : 0;
        } else {
            // init input file 
            $("input[type='file']").val(null);
            delete $scope.file;
            $scope.getMyWordsets();
            $scope.phase = 0;
        }
    }
    
     $scope.msgs = [
            {
                glyphicon : "glyphicon glyphicon-open-file",
                message : 'Select text file'
            },
            {
                glyphicon : "glyphicon glyphicon-edit",
                message : 'Input word sets'
            },
            {
                glyphicon : "glyphicon glyphicon-retweet",
                message : 'Push button to replace'
            },
            {
                glyphicon : "glyphicon glyphicon-save-file",
                message : 'Push button to save file'
            },
            {
                glyphicon : "glyphicon glyphicon-check",
                message : 'Check output file, please'
            },
        ]
                        
}]);

/////////////////////////////////////////////////////////

myapp.directive('onReadFile', function ($parse) {
	return {
		restrict: 'A',
		scope: false,
		link: function(scope, element, attrs) {
            var fn = $parse(attrs.onReadFile);
            
			element.on('change', function(onChangeEvent) {
                
                var file = (onChangeEvent.srcElement || onChangeEvent.target).files[0];
                
				var reader = new FileReader();
                
                reader.onload = function(onLoadEvent) {
                    
                    var myfile = {
                        content: onLoadEvent.target.result,
                        name: file.name,
                        size: file.size,
                        lastModifiedDate: file.lastModifiedDate
                    }
                    
					scope.$apply(function() {
						fn(scope, { $file: myfile });
					});
				};

				reader.readAsText( file );
                
			});
		}
	};
}); // https://veamospues.wordpress.com/2014/01/27/reading-files-with-angularjs/

/////////////////////////////////////////////////////////

myapp.config(['$compileProvider', function ($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|blob):/);
}]) // unsafe 문제 해결
//http://stackoverflow.com/questions/16514509/how-do-you-serve-a-file-for-download-with-angularjs-or-javascript
