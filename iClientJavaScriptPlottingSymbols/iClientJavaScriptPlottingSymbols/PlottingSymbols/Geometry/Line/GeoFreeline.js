/**
 * @requires SuperMap.Geometry.Point
 * @requires SuperMap.Geometry.GeoLinePlotting
 */

/**
 *
 * Class: SuperMap.Geometry.GeoFreeline
 * 自由线。
 * 由鼠标移动轨迹而形成的自由线。
 *
 * Inherits from:
 *  - <SuperMap.Geometry.GeoLinePlotting>
 */
SuperMap.Geometry.GeoFreeline = SuperMap.Class(
    SuperMap.Geometry.GeoLinePlotting, {
        /**
         * Constructor: SuperMap.Geometry.GeoFreeline
         * 构造函数
         *
         * Parameters:
         * points - {Array(<SuperMap.Geometry.Point>)} 需要传入的控制点（两个或两个以上），默认为null
         */
        initialize: function(points) {
            SuperMap.Geometry.GeoLinePlotting.prototype.initialize.apply(this, arguments);
        },

        /**
         * APIMethod: toJSON
         * 将军标符号闭合曲线对象转换为json数据（只解析了控制点）
         *
         * Returns:
         * {String} 返回的字符串。
         */
        toJSON: function(){
            return SuperMap.Geometry.GeoLinePlotting.prototype.toJSON.apply(this, arguments);
        },

        /**
         * APIMethod: clone
         * 重写clone方法，必须深赋值
         *
         * Returns:
         * {String} 返回几何对象。
         */
        clone: function(){
            var geometry =new SuperMap.Geometry.GeoFreeline();
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
         * 将所有控制点绘制成自由线
         */
        calculateParts: function(){
            var controlPoits = this.cloneControlPoints(this._controlPoints);

            //清空原有的所有点
            this.components = [];
            //两个以上控制点时，绘制自由线
            if(controlPoits.length>1)
            {
                this.components=controlPoits;
            }

        },

        CLASS_NAME: "SuperMap.Geometry.GeoFreeline"
    }
);

/**
 * APIMethod: fromJSON
 * 根据json数据转换为 GeoFreeline 对象
 *
 * Parameters:
 * str - {String} json数据
 *
 * Returns:
 * {<SuperMap.Geometry.GeoFreeline>} 返回的 GeoFreeline 对象。
 */
SuperMap.Geometry.GeoFreeline.fromJSON = function(str){
    var geometry = new SuperMap.Geometry.GeoFreeline();
    //匹配控制点的数据
    //取第二个代表获取括号内匹配的
    var s = str.match(/"controlPoints":(\[.*?\])/)[1];
    var arr = SuperMap.Geometry.GeoLinePlotting.getControlPointsFromJSON(s);
    geometry._controlPoints = arr;
    return geometry;
};