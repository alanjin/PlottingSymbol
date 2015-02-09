/**
 * @requires SuperMap.Geometry.Point
 * @requires SuperMap.Geometry.GeoMultiPoint
 */

/**
 *
 * Class: SuperMap.Geometry.GeoMultiPoint
 * 多点。
 * 绘制多个点
 *
 * Inherits from:
 *  - <SuperMap.Geometry.MultiPoint>
 */
SuperMap.Geometry.GeoMultiPoint = SuperMap.Class(
    SuperMap.Geometry.MultiPoint, {
        /**
         * Property: _controlPoints
         * 定义控制点字段
         * 用于存储标绘扩展符号的所有控制点
         */
        _controlPoints: [],
        /**
         * Property: isMultiPlotting
         * 用于绘制时判断是否是复合标绘符号
         */
        isMultiPlotting:true,
        /**
         * Constructor: SuperMap.Geometry.GeoMultiPoint
         * 构造函数
         *
         * Parameters:
         * points - {Array(<SuperMap.Geometry.Point>)} 需要传入的控制点，默认为null
         */
        initialize: function(points) {
            SuperMap.Geometry.MultiPoint.prototype.initialize.apply(this, arguments);
            this._controlPoints = points;
            if (points && points.length > 0) {
                this.calculateParts();
            }
        },

        /**
         /**
         * APIMethod: toJSON
         * 将标绘扩展对象转换为json数据（只解析控制点）
         *
         * Returns:
         * {String} 返回转换后的 JSON 对象。
         */
        toJSON: function () {
            if (!this._controlPoints) {
                return null;
            }

            var len = this._controlPoints.length;
            var arr = [];
            for (var i = 0; i < len; i++) {
                arr.push(this.controlPointToJSON(this._controlPoints[i]));
            }

            return "{\"controlPoints\":[" + arr.join(",") + "]}";
        },
        /**
         * Method: controlPointToJSON
         * 将控制点转换为Json
         *
         * Parameters:
         * cp - {<SuperMap.Geometry.Point>} 要转换为Json的控制点
         */
        controlPointToJSON: function (cp) {
            return "{\"x\":  " + cp.x + ", \"y\": " + cp.y + "}";
        },

        /**
         * APIMethod: getControlPoints
         * 获取符号控制点
         */
        getControlPoints: function () {
            return this._controlPoints;
        },

        /**
         * APIMethod: setControlPoint
         * 设置控制点
         *
         * Parameters:
         * points - {Array(<SuperMap.Geometry.Point>)} 控制点数组
         */
        setControlPoint: function (points) {
            if (points && points.length && points.length > 0) {
                this._controlPoints = points;
                this.calculateParts();
            }
        },

        /**
         * APIMethod: clone
         * 重写clone方法，必须深赋值
         *
         * Returns:
         * {String} 返回几何对象。
         */
        clone: function(){
            var geoMultiPoint =new SuperMap.Geometry.GeoMultiPoint();
            var controlPoints = [];
            //这里只需要赋值控制点
            for(var i = 0, len = this._controlPoints.length; i<len; i++)
            {
                //这里必须深赋值，不然在编辑时由于引用的问题出现错误
                controlPoints.push(this._controlPoints[i].clone());
            }
            geoMultiPoint._controlPoints = controlPoints;
            return geoMultiPoint;
        },


        /**
         * Method: calculateParts
         * 重写了父类的方法
         * 用于通过中点和边缘点计算圆的边缘360个点，组成一个圆
         */
        calculateParts: function(){
            var controlPoints = this.cloneControlPoints(this._controlPoints);
            //清空原有的所有点
            this.components = [];
            //至少需要两个控制点
            if(this._controlPoints.length>0)
            {
                 this.components=controlPoints;
            }
        },
        /**
         * Method: cloneControlPoints
         * 克隆控制点数组
         *
         */
        cloneControlPoints: function (cp) {
            var controlPoints = [];

            for (var i = 0; i < cp.length; i++) {
                controlPoints.push(cp[i].clone());
            }
            return controlPoints;
        },


        CLASS_NAME: "SuperMap.Geometry.GeoMultiPoint"
    }
);
/**
 * APIMethod: getControlPointsFromJSON
 * 根据控制点字符串获取控制点数据
 *
 * Parameters:
 * str - {String} 控制点字符串，形如："[{...},{...}...]"
 *
 * Returns:
 * {Array(<SuperMap.Geometry.Point>)} 控制点数组
 */
SuperMap.Geometry.GeoMultiPoint.getControlPointsFromJSON = function(str){
    var cps = [];
    //匹配每一个Point的json格式
    var r = /{.*?}/g;
    var arr = str.match(r);
    for(var i = 0, len = arr.length ;i<len; i++)
    {
        var point = eval('(' + arr[i] + ')');
        cps.push(new SuperMap.Geometry.Point(point.x, point.y));
    }
    return cps;
};
/**
 * APIMethod: fromJSON
 * 根据json数据转换为 GeoMultiPoint 对象
 *
 * Parameters:
 * str - {String} json数据
 *
 * Returns:
 * {<SuperMap.Geometry.GeoMultiPoint>} 返回的 GeoMultiPoint 对象。
 */
SuperMap.Geometry.GeoMultiPoint.fromJSON = function(str){
    var point = new SuperMap.Geometry.GeoMultiPoint();
    //匹配控制点的数据
    //取第二个代表获取括号内匹配的
    var s = str.match(/"controlPoints":(\[.*?\])/)[1];
    var arr = SuperMap.Geometry.MultiPoint.getControlPointsFromJSON(s);
    point._controlPoints = arr;
    return point;
};