/**
 * @requires SuperMap.Geometry.Point
 * @requires SuperMap.Geometry.GeoMultiLinePlotting
 */

/**
 *
 * Class: SuperMap.Geometry.GeoSectorSearch
 * 扇形搜寻区。
 * 使用两个控制点直接创建扇形搜寻区。
 *
 * Inherits from:
 *  - <SuperMap.Geometry.GeoMultiLinePlotting>
 */
SuperMap.Geometry.GeoSectorSearch = SuperMap.Class(
    SuperMap.Geometry.GeoMultiLinePlotting, {

        /**
         * Constructor: SuperMap.Geometry.GeoSectorSearch
         * 构造函数
         *
         * Parameters:
         * points - {Array(<SuperMap.Geometry.Point>)} 需要传入的控制点（两个），默认为null
         */
        initialize: function(points) {
            SuperMap.Geometry.GeoMultiLinePlotting.prototype.initialize.apply(this, arguments);
        },

        /**
         * APIMethod: toJSON
         * 将军标符号扇形搜寻区对象转换为json数据（只解析了控制点）
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
            var geometry =new SuperMap.Geometry.GeoSectorSearch();
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
         * 用于通过控制点计算扇形搜寻区的所有点
         */
        calculateParts: function(){
            var controlPoints = this.cloneControlPoints(this._controlPoints);

            //清空原有的所有线
            this.components = [];
            //两个控制点时，绘制直线
            if(controlPoints.length>1)
            {
                var multiLines=[];
                //第一个点为起点，也是中心点
                var centerPoint=controlPoints[0];
                var offsetX=2*centerPoint.x;
                var offsetY=2*centerPoint.y;
                //第二个点确定半径和起始方向，且为第一个扇形(Fisrst)的点
                var point_FB=controlPoints[controlPoints.length-1];
                var radius=this.calculateDistance(centerPoint,point_FB);
                var vector_S=this.toVector(centerPoint,point_FB);
                //起始方向向右120°为第二个方向，确定第一个扇形的点
                var vectors=this.calculateVector(vector_S,4*Math.PI/3,radius);
                var vector_FR=vectors[0];
                var point_FC=new SuperMap.Geometry.Point(vector_FR.x+centerPoint.x,vector_FR.y+centerPoint.y);

                //第二个(second)扇形
                var point_SB=new SuperMap.Geometry.Point(-point_FC.x+offsetX,-point_FC.y+offsetY);
                var vector_SL=vectors[1];
                var point_SC=new SuperMap.Geometry.Point(vector_SL.x+centerPoint.x,vector_SL.y+centerPoint.y);

                //第三个(Third)扇形
                var point_TB=new SuperMap.Geometry.Point(-point_SC.x+offsetX,-point_SC.y+offsetY);
                var point_TC=new SuperMap.Geometry.Point(-point_FB.x+offsetX,-point_FB.y+offsetY);

                //连接点成扇形搜寻符号
                var points=[centerPoint,point_FB,point_FC,point_SB,point_SC,point_TB,point_TC,centerPoint];
                multiLines.push(new SuperMap.Geometry.LineString(points));

                //计算各边的箭头
                var arrows_FA=this.calculateArrowLines(centerPoint,point_FB);
                var arrows_FB=this.calculateArrowLines(point_FB,point_FC);
                var arrows_FC=this.calculateArrowLines(point_FC,point_SB);
                var arrows_SB=this.calculateArrowLines(point_SB,point_SC);
                var arrows_SC=this.calculateArrowLines(point_SC,point_TB);
                var arrows_TB=this.calculateArrowLines(point_TB,point_TC);
                var arrows_TC=this.calculateArrowLines(point_TC,centerPoint);
                multiLines.push(arrows_FA[0],arrows_FA[1]);
                multiLines.push(arrows_FB[0],arrows_FB[1]);
                multiLines.push(arrows_FC[0],arrows_FC[1]);
                multiLines.push(arrows_SB[0],arrows_SB[1]);
                multiLines.push(arrows_SC[0],arrows_SC[1]);
                multiLines.push(arrows_TB[0],arrows_TB[1]);
                multiLines.push(arrows_TC[0],arrows_TC[1]);
                this.components=multiLines;

            }
        },


        CLASS_NAME: "SuperMap.Geometry.GeoSectorSearch"
    }
);

/**
 * APIMethod: fromJSON
 * 根据json数据转换为 GeoSectorSearch 对象
 *
 * Parameters:
 * str - {String} json数据
 *
 * Returns:
 * {<SuperMap.Geometry.GeoSectorSearch>} 返回的 GeoSectorSearch 对象。
 */
SuperMap.Geometry.GeoSectorSearch.fromJSON = function(str){
    var geoPolyline = new SuperMap.Geometry.GeoSectorSearch();
    //匹配控制点的数据
    //取第二个代表获取括号内匹配的
    var s = str.match(/"controlPoints":(\[.*?\])/)[1];
    var arr = SuperMap.Geometry.GeoLinePlotting.getControlPointsFromJSON(s);
    geoPolyline._controlPoints = arr;
    return geoPolyline;
};