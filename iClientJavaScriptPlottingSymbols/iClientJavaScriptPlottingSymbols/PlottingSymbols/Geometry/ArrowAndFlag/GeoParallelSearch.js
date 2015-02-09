/**
 * @requires SuperMap.Geometry.Point
 * @requires SuperMap.Geometry.GeoMultiLinePlotting
 */

/**
 *
 * Class: SuperMap.Geometry.GeoParallelSearch
 * 平行搜寻区。
 * 使用三个或三个以上控制点直接创建平行搜寻区。
 *
 * Inherits from:
 *  - <SuperMap.Geometry.GeoMultiLinePlotting>
 */
SuperMap.Geometry.GeoParallelSearch = SuperMap.Class(
    SuperMap.Geometry.GeoMultiLinePlotting, {

        /**
         * Constructor: SuperMap.Geometry.GeoParallelSearch
         * 构造函数
         *
         * Parameters:
         * points - {Array(<SuperMap.Geometry.Point>)} 需要传入的控制点（三个或三个以上），默认为null
         */
        initialize: function(points) {
            SuperMap.Geometry.GeoMultiLinePlotting.prototype.initialize.apply(this, arguments);
        },

        /**
         * APIMethod: toJSON
         * 将军标符号平行搜寻区对象转换为json数据（只解析了控制点）
         *
         * Returns:
         * {String} 返回的字符串。
         */
        toJSON: function(){
            return SuperMap.Geometry.GeoMultiLinePlotting.prototype.toJSON.apply(this, arguments);
        },

        /**
         * APIMethod: clone
         * 重写clone方法，必须深赋值
         *
         * Returns:
         * {String} 返回几何对象。
         */
        clone: function(){
            var geometry =new SuperMap.Geometry.GeoParallelSearch();
            var controlPoints = [];
            //这里只需要赋值控制点
            for(var i = 0, len = this._controlPoints.length; i<len; i++)
            {
                //这里必须深赋值，不然在编辑时由于引用的问题出现错误
                controlPoints.push(this._controlPoints[i].clone());
            }
            geometry._controlPoints = controlPoints;
            return geometry;
        },
        /**
         * Method: calculateParts
         * 重写了父类的方法
         * 用于通过控制点计算平行搜寻区的所有点
         */
        calculateParts: function(){
            var controlPoints = this.cloneControlPoints(this._controlPoints);

            //清空原有的所有线
            this.components = [];
            //两个控制点时，绘制直线
            if(controlPoints.length>1)
            {
                this.components.push(new SuperMap.Geometry.LineString(controlPoints));

            }
            if(controlPoints.length>2)
            {

                var firstP=controlPoints[0];
                var secondP=controlPoints[1];
                //第一、二个点的向量为基准向量
                var vectorBase=this.toVector(firstP,secondP);
                //基准向量的法向量
                var vectorNormal=this.calculateVector(vectorBase)[0];
                //从第三个点开始，当i为奇数，则第i-1、i个点的向量垂直于基准向量，当i为偶数，则第i-1、i个点的向量平行于垂直基准向量。
                var isParalel=false;

                var points=[];
                points.push(firstP);

                var multiLine=[];
                for(var i=1;i<controlPoints.length;i++)
                {
                    //判断是否平行
                    isParalel=i%2!==0;
                    var pointI=controlPoints[i];
                    //平行
                    if(isParalel){

                        var previousP=points[i-1].clone();
                        var point=this.calculateIntersection(vectorNormal,vectorBase,pointI,previousP);
                        points.push(point);
                        var arrowLines=this.calculateArrowLines(previousP,point,15);
                        multiLine.push(arrowLines[0]);
                        multiLine.push(arrowLines[1]);
                    }
                    //垂直
                    else{

                        var previousP=points[i-1];
                        var point=this.calculateIntersection(vectorBase,vectorNormal,pointI,previousP);
                        points.push(point);
                        var arrowLines=this.calculateArrowLines(previousP,point,15);
                        multiLine.push(arrowLines[0]);
                        multiLine.push(arrowLines[1]);

                    }
                    multiLine.unshift(new SuperMap.Geometry.LineString(points));

                }
                this.components=multiLine;

            }

        },


        CLASS_NAME: "SuperMap.Geometry.GeoParallelSearch"
    }
);

/**
 * APIMethod: fromJSON
 * 根据json数据转换为 GeoParallelSearch 对象
 *
 * Parameters:
 * str - {String} json数据
 *
 * Returns:
 * {<SuperMap.Geometry.GeoParallelSearch>} 返回的 GeoParallelSearch 对象。
 */
SuperMap.Geometry.GeoParallelSearch.fromJSON = function(str){
    var geoPolyline = new SuperMap.Geometry.GeoParallelSearch();
    //匹配控制点的数据
    //取第二个代表获取括号内匹配的
    var s = str.match(/"controlPoints":(\[.*?\])/)[1];
    var arr = SuperMap.Geometry.GeoLinePlotting.getControlPointsFromJSON(s);
    geoPolyline._controlPoints = arr;
    return geoPolyline;
};