/**
 * @requires SuperMap/Geometry/Collection.js
 * @requires SuperMap/Geometry/LinearRing.js
 * @requires SuperMap.Geometry.Point.js
 * @requires SuperMap.Geometry.Polygon.js
 * @requires SuperMap.Geometry.GeoPlotting
 */

/**
 *
 * Class: SuperMap.Geometry.GeoCurveFlag
 * 曲线旗标。
 * 使用两个控制点直接创建曲线旗标
 *
 * Inherits from:
 *  - <SuperMap.Geometry.GeoPlotting>
 */
SuperMap.Geometry.GeoCurveFlag = SuperMap.Class(
    SuperMap.Geometry.GeoPlotting, {
        /**
         * Constructor: SuperMap.Geometry.GeoCurveFlag
         * 构造函数
         *
         * Parameters:
         * points - {Array(<SuperMap.Geometry.Point>)} 需要传入的控制点（理论上应该是两个），默认为null
         */
        initialize: function(points) {
            SuperMap.Geometry.GeoPlotting.prototype.initialize.apply(this, arguments);
        },

        /**
         * APIMethod: toJSON
         * 将军标符号曲线旗标对象转换为json数据（只解析了控制点）
         *
         * Returns:
         * {String} 返回的字符串。
         */
        toJSON: function(){
            return SuperMap.Geometry.GeoPlotting.prototype.toJSON.apply(this, arguments);
        },

        /**
         * APIMethod: clone
         * 重写clone方法，必须深赋值
         *
         * Returns:
         * {String} 返回几何对象。
         */
        clone: function(){
            var geoCurveFlag =new SuperMap.Geometry.GeoCurveFlag();
            var controlPoints = [];
            //这里只需要赋值控制点
            for(var i = 0, len = this._controlPoints.length; i<len; i++)
            {
                //这里必须深赋值，不然在编辑时由于引用的问题出现错误
                controlPoints.push(this._controlPoints[i].clone());
            }
            geoCurveFlag._controlPoints = controlPoints;
            return geoCurveFlag;
        },
        /**
         * Method: calculateParts
         * 重写了父类的方法
         * 用于通过两个控制点计算曲线旗标的所有点
         */
        calculateParts: function(){
            var controlPois = this.cloneControlPoints(this._controlPoints);
            
            //清空原有的所有点
            this.components = [];
            //至少需要两个控制点
            if(controlPois.length>1)
            {
                //取第一个
                var startPoint = controlPois[0];
                //取最后一个
                var endPoint = controlPois[controlPois.length-1];
                //上曲线起始点
                var point1 = startPoint;
                //上曲线第一控制点
                var point2 = new SuperMap.Geometry.Point((endPoint.x-startPoint.x)/4+startPoint.x,(endPoint.y-startPoint.y)/8+startPoint.y);
                //上曲线第二个点
                var point3 = new SuperMap.Geometry.Point((startPoint.x+endPoint.x)/2,startPoint.y);
                //上曲线第二控制点
                var point4 = new SuperMap.Geometry.Point((endPoint.x-startPoint.x)*3/4+startPoint.x,-(endPoint.y-startPoint.y)/8+startPoint.y);
                //上曲线结束点
                var point5 = new SuperMap.Geometry.Point(endPoint.x,startPoint.y);

                //下曲线结束点
                var point6 = new SuperMap.Geometry.Point(endPoint.x,(startPoint.y+endPoint.y)/2);
                //下曲线第二控制点
                var point7 = new SuperMap.Geometry.Point((endPoint.x-startPoint.x)*3/4+startPoint.x,(endPoint.y-startPoint.y)*3/8+startPoint.y);
                //下曲线第二个点
                var point8 = new SuperMap.Geometry.Point((startPoint.x+endPoint.x)/2,(startPoint.y+endPoint.y)/2);
                //下曲线第一控制点
                var point9 = new SuperMap.Geometry.Point((endPoint.x-startPoint.x)/4+startPoint.x,(endPoint.y-startPoint.y)*5/8+startPoint.y);
                //下曲线起始点
                var point10 = new SuperMap.Geometry.Point(startPoint.x,(startPoint.y+endPoint.y)/2);
                //旗杆底部点
                var point11 = new SuperMap.Geometry.Point(startPoint.x,endPoint.y);
                //计算上曲线
                var curve1 = SuperMap.Geometry.LineString.createBezier2([point1,point2,point3,point4,point5]).components;
                //计算下曲线
                var curve2 = SuperMap.Geometry.LineString.createBezier2([point6,point7,point8,point9,point10]).components;

                //合并
                var points = curve1.concat(curve2);
                points.push(point11);

                this.components.push(new SuperMap.Geometry.LinearRing(points));
            }
        },

        CLASS_NAME: "SuperMap.Geometry.GeoCurveFlag"
    }
);

/**
 * APIMethod: fromJSON
 * 根据json数据转换为 GeoCurveFlag 对象
 *
 * Parameters:
 * str - {String} json数据
 *
 * Returns:
 * {<SuperMap.Geometry.GeoCurveFlag>} 返回的 GeoCurveFlag 对象。
 */
SuperMap.Geometry.GeoCurveFlag.fromJSON = function(str){
    var geoCurveFlag = new SuperMap.Geometry.GeoCurveFlag();
    //匹配控制点的数据
    //取第二个代表获取括号内匹配的
    var s = str.match(/"controlPoints":(\[.*?\])/)[1];
    var arr = SuperMap.Geometry.GeoPlotting.getControlPointsFromJSON(s);
    geoCurveFlag._controlPoints = arr;
    return geoCurveFlag;
};