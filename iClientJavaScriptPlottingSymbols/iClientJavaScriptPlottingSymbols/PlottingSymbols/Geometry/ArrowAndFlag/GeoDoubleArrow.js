/**
 * @requires SuperMap/Geometry/Collection.js
 * @requires SuperMap/Geometry/LinearRing.js
 * @requires SuperMap.Geometry.Point.js
 * @requires SuperMap.Geometry.Polygon.js
 * @requires SuperMap.Geometry.GeoPlotting
 */

/**
 *
 * Class: SuperMap.Geometry.GeoDoubleArrow
 * 双箭头
 *
 * Inherits from:
 *  - <SuperMap.Geometry.GeoPlotting>
 */
SuperMap.Geometry.GeoDoubleArrow = SuperMap.Class(
    SuperMap.Geometry.GeoPlotting, {
        /**
         * Constructor: SuperMap.Geometry.GeoDoubleArrow
         * 构造函数
         *
         * Parameters:
         * points - {Array(<SuperMap.Geometry.Point>)} 初始化时传入的控制点（理论上为四个，默认为null）
         */
        initialize: function(points) {
            SuperMap.Geometry.GeoPlotting.prototype.initialize.apply(this, arguments);
        },

        /**
         * APIMethod: toJSON
         * 将军标符号双箭头对象转换为json数据（只解析了控制点）
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
            var geoDoubleArrow =new SuperMap.Geometry.GeoDoubleArrow();
            var controlPoints = [];
            //这里只需要赋值控制点
            for(var i = 0, len = this._controlPoints.length; i<len; i++)
            {
                //这里必须深赋值，不然在编辑时由于引用的问题出现错误
                controlPoints.push(this._controlPoints[i].clone());
            }
            geoDoubleArrow._controlPoints = controlPoints;
            return geoDoubleArrow;
        },

        /**
         * Method: calculateParts
         * 重写了父类的方法
         * 用于通过控制点计算箭头的所有绘制点
         */
        calculateParts: function(){
            //判定少于四个点或者为空，则直接返回
            if(this._controlPoints == null || this._controlPoints.length<4)
            {
                return;
            }

            var controlPois = this.cloneControlPoints(this._controlPoints);
            
            //定义四个用户输入点
            var pointU_1 = controlPois[0];
            var pointU_2 = controlPois[1];
            var pointU_3 = controlPois[2];
            var pointU_4 = controlPois[3];

            //计算控制点
            //计算中间用户点
            var pointU_C = new SuperMap.Geometry.Point(((pointU_1.x+pointU_2.x)*5+(pointU_3.x+pointU_4.x))/12,((pointU_1.y+pointU_2.y)*5+(pointU_3.y+pointU_4.y))/12);
            //计算左边外弧的控制点
            var pointC_l_out = this.calculateIntersectionFromTwoCorner(pointU_1,pointU_4,Math.PI/8,Math.PI/6)[0];
            //计算左边内弧的控制点
            var pointC_l_inner = this.calculateIntersectionFromTwoCorner(pointU_C,pointU_4,Math.PI/8,Math.PI/16)[0];
            //计算右边外弧的控制点
            var pointC_r_out = this.calculateIntersectionFromTwoCorner(pointU_2,pointU_3,Math.PI/8,Math.PI/6)[1];
            //计算右边内弧的控制点
            var pointC_r_inner = this.calculateIntersectionFromTwoCorner(pointU_C,pointU_3,Math.PI/8,Math.PI/16)[1];

            //

            var v_l_out = new SuperMap.Geometry.Point(pointC_l_out.x-pointU_4.x,pointC_l_out.y-pointU_4.y);
            var d_l_out = Math.sqrt(v_l_out.x*v_l_out.x+v_l_out.y*v_l_out.y);
            //单位向量
            var v_l_out_1 = new SuperMap.Geometry.Point(v_l_out.x/d_l_out,v_l_out.y/d_l_out);

            var v_l_inner = new SuperMap.Geometry.Point(pointC_l_inner.x-pointU_4.x,pointC_l_inner.y-pointU_4.y);
            var d_l_inner = Math.sqrt(v_l_inner.x*v_l_inner.x+v_l_inner.y*v_l_inner.y);
            //单位向量
            var v_l_inner_1 = new SuperMap.Geometry.Point(v_l_inner.x/d_l_inner,v_l_inner.y/d_l_inner);

            //定义箭头头部的大小比例
            var ab = 0.25;

            //取最短的，除以5是一个经验值，这样效果比较好
            var d_l_a = d_l_out<d_l_inner?d_l_out*ab:d_l_inner*ab;
            //
            var pointC_l_out_2 = new SuperMap.Geometry.Point(v_l_out_1.x*d_l_a+pointU_4.x,v_l_out_1.y*d_l_a+pointU_4.y);
            var pointC_l_inner_2 = new SuperMap.Geometry.Point(v_l_inner_1.x*d_l_a+pointU_4.x,v_l_inner_1.y*d_l_a+pointU_4.y);

            //左箭头左边点
            var pointC_l_a_l = new SuperMap.Geometry.Point(pointC_l_out_2.x*1.5-pointC_l_inner_2.x*0.5,pointC_l_out_2.y*1.5-pointC_l_inner_2.y*0.5);
            //左箭头右边点
            var pointC_l_a_r = new SuperMap.Geometry.Point(pointC_l_inner_2.x*1.5-pointC_l_out_2.x*0.5,pointC_l_inner_2.y*1.5-pointC_l_out_2.y*0.5);

            var v_r_out = new SuperMap.Geometry.Point(pointC_r_out.x-pointU_3.x,pointC_r_out.y-pointU_3.y);
            var d_r_out = Math.sqrt(v_r_out.x*v_r_out.x+v_r_out.y*v_r_out.y);
            var v_r_out_1 = new SuperMap.Geometry.Point(v_r_out.x/d_r_out,v_r_out.y/d_r_out);

            var v_r_inner = new SuperMap.Geometry.Point(pointC_r_inner.x-pointU_3.x,pointC_r_inner.y-pointU_3.y);
            var d_r_inner = Math.sqrt(v_r_inner.x*v_r_inner.x+v_r_inner.y*v_r_inner.y);
            var v_r_inner_1 = new SuperMap.Geometry.Point(v_r_inner.x/d_r_inner,v_r_inner.y/d_r_inner);

            //取最短的，除以5是一个经验值，这样效果比较好
            var d_r_a = d_r_out<d_r_inner?d_r_out*ab:d_r_inner*ab;
            var pointC_r_out_2 = new SuperMap.Geometry.Point(v_r_out_1.x*d_r_a+pointU_3.x,v_r_out_1.y*d_r_a+pointU_3.y);
            var pointC_r_inner_2 = new SuperMap.Geometry.Point(v_r_inner_1.x*d_r_a+pointU_3.x,v_r_inner_1.y*d_r_a+pointU_3.y);

            //右箭头箭头右边点
            var pointC_r_a_r = new SuperMap.Geometry.Point(pointC_r_out_2.x*1.5-pointC_r_inner_2.x*0.5,pointC_r_out_2.y*1.5-pointC_r_inner_2.y*0.5);
            //左箭头左边点
            var pointC_r_a_l = new SuperMap.Geometry.Point(pointC_r_inner_2.x*1.5-pointC_r_out_2.x*0.5,pointC_r_inner_2.y*1.5-pointC_r_out_2.y*0.5);

            //计算坐边外弧所有点
            var points_l = SuperMap.Geometry.LineString.createBezier2([pointU_1,pointC_l_out,pointC_l_out_2]).components;

            //计算控制点
            //定义向量
            var v_U_4_3 = new SuperMap.Geometry.Point(pointU_3.x-pointU_4.x,pointU_3.y-pointU_4.y);

            //取部分
            //需要优化，不能左右都取一样，需要按照左右的长度取值，这样更合理一些
            //取u4和C的向量模
            //取u3和C的向量模
            //根据模的大小来取左右向量的长度，；来定位置
            var v_U_4_C = new SuperMap.Geometry.Point(pointU_C.x-pointU_4.x,pointU_C.y-pointU_4.y);
            //求模
            var d_U_4_C = Math.sqrt(v_U_4_C.x*v_U_4_C.x+v_U_4_C.y*v_U_4_C.y);
            var v_U_3_C = new SuperMap.Geometry.Point(pointU_C.x-pointU_3.x,pointU_C.y-pointU_3.y);
            //求模
            var d_U_3_C = Math.sqrt(v_U_3_C.x*v_U_3_C.x+v_U_3_C.y*v_U_3_C.y);

            var percent = 0.4;
            var v_U_4_3_ = new SuperMap.Geometry.Point(v_U_4_3.x*percent,v_U_4_3.y*percent);
            var v_U_4_3_l = new SuperMap.Geometry.Point(v_U_4_3_.x*d_U_4_C/(d_U_4_C+d_U_3_C),v_U_4_3_.y*d_U_4_C/(d_U_4_C+d_U_3_C));
            var v_U_4_3_r = new SuperMap.Geometry.Point(v_U_4_3_.x*d_U_3_C/(d_U_4_C+d_U_3_C),v_U_4_3_.y*d_U_3_C/(d_U_4_C+d_U_3_C));
            //中心点的左控制点
            var pointC_c_l = new SuperMap.Geometry.Point(pointU_C.x-v_U_4_3_l.x,pointU_C.y-v_U_4_3_l.y);
            //中心点右边的控制点
            var pointC_c_r = new SuperMap.Geometry.Point(pointU_C.x+v_U_4_3_r.x,pointU_C.y+v_U_4_3_r.y);

            //测试
            var arr = [pointC_l_inner_2,pointC_l_inner,pointC_c_l,pointU_C,pointC_c_r,pointC_r_inner,pointC_r_inner_2];

            var points_c = SuperMap.Geometry.LineString.createBezier1(arr,0,20).components;
            //var points_c = SuperMap.Geometry.LineString.createBezier(arr,0.05).components;

            //计算右边外弧的所有点
            var points_r = SuperMap.Geometry.LineString.createBezier2([pointC_r_out_2,pointC_r_out,pointU_2]).components;

            //定义结果数组
            var result = points_l;
            result.push(pointC_l_a_l);
            result.push(pointU_4);
            result.push(pointC_l_a_r);
            result = result.concat(points_c);
            result.push(pointC_r_a_l);
            result.push(pointU_3);
            result.push(pointC_r_a_r);
            result = result.concat(points_r);
            //清空原有的所有点
            this.components = [];
            this.components.push(new SuperMap.Geometry.LinearRing(result));
        },

        CLASS_NAME: "SuperMap.Geometry.GeoDoubleArrow"
    }
);

/**
 * APIMethod: fromJSON
 * 根据json数据转换为 GeoDoubleArrow 对象
 *
 * Parameters:
 * str - {String} json数据
 *
 * Returns:
 * {<SuperMap.Geometry.GeoDoubleArrow>} 返回的 GeoDoubleArrow 对象。
 */
SuperMap.Geometry.GeoDoubleArrow.fromJSON = function(str){
    var geoDoubleArrow = new SuperMap.Geometry.GeoDoubleArrow();
    //匹配控制点的数据
    //取第二个代表获取括号内匹配的
    var s = str.match(/"controlPoints":(\[.*?\])/)[1];
    var arr = SuperMap.Geometry.GeoPlotting.getControlPointsFromJSON(s);
    geoDoubleArrow._controlPoints = arr;
    return geoDoubleArrow;
};