package web.geometry
{
	import com.supermap.web.core.Point2D;
	import com.supermap.web.sm_internal;
	import com.supermap.web.core.geometry.GeoLine;
	import com.supermap.web.core.geometry.Geometry;
	
	use namespace sm_internal;
	/**
	 * 斜箭头
	 */
	public class GeoDiagonalArrow extends GeoPlotting
	{
		/**
		 * 箭头长度与宽度的比值，箭头三角形需要占用总长度的1/_ratio
		 */
		private var _ratio:Number = 6;
		/**
		 * 构造函数
		 *  @param points 初始化时传入的控制点（理论上至少两个，默认为null）
		 */
		public function GeoDiagonalArrow(points:Array=null)
		{
			super(points);
		}
		/**
		 * 获取箭头长宽比值，默认为6倍
		 */
		public function get ratio():Number
		{
			return _ratio;
		}
		/**
		 * 设置箭头长宽比值，默认为6倍
		 */
		public function set ratio(value:Number):void
		{
			_ratio = value;
		}
		/**
		 * 重写了父类的方法
		 * 用于通过控制点计算箭头的所有绘制点
		 */
		override protected function calculateParts():void
		{
			//判定少于两个点或者为空，则直接返回
			if(this._controlPoints == null || this._controlPoints.length<2)
			{
				return;
			}
			//判断如果为两个点，且两个点重合时也直接返回
			if(this._controlPoints.length == 2 && (this._controlPoints[0] as Point2D).equals(this._controlPoints[1] as Point2D))
			{
				return;
			}
			//清空原有的所有点
			this.parts = new Array();
			//计算只有两个点时，即直的斜箭头
			if(this._controlPoints.length == 2)
			{
				this.calculateTwoPoints();
			}
			//计算有三个或三个以上的点时，即弯曲的斜箭头
			else
			{
				this.calculateMorePoints();
			}
		}
		
		/**
		 * 只有两个控制点时
		 */
		private function calculateTwoPoints():void
		{
			//取出首尾两个点
			var pointS:Point2D = _controlPoints[0] as Point2D;
			var pointE:Point2D = _controlPoints[1] as Point2D;
			//计算箭头总长度
			var l:Number = Math.sqrt((pointE.y-pointS.y)*(pointE.y-pointS.y)+(pointE.x-pointS.x)*(pointE.x-pointS.x));
			//计算直箭头的宽
			var w:Number = l/this._ratio;
			
			//计算三角形的底边中心点坐标
			var x_:Number = pointS.x + (pointE.x - pointS.x)*(this._ratio-1)/this._ratio;
			var y_:Number = pointS.y + (pointE.y - pointS.y)*(this._ratio-1)/this._ratio;
			var point_o:Point2D = new Point2D(x_,y_);
			
			//计算
			var v_lr_:Array = this.calculateVector(new Point2D(pointE.x-pointS.x,pointE.y-pointS.y),Math.PI/2,w/2);
			//获取左边尾部向量
			var v_l_:Point2D = v_lr_[0] as Point2D;
			//获取右边尾部向量
			var v_r_:Point2D = v_lr_[1] as Point2D;
			//获取左边尾部点
			var point_l:Point2D = new Point2D(v_l_.x+pointS.x,v_l_.y+pointS.y);
			//获取右边尾部点
			var point_r:Point2D = new Point2D(v_r_.x+pointS.x,v_r_.y+pointS.y);
			
			var point_h_l:Point2D = new Point2D(v_l_.x/this._ratio+x_,v_l_.y/this._ratio+y_);
			var point_h_r:Point2D = new Point2D(v_r_.x/this._ratio+x_,v_r_.y/this._ratio+y_);
			
			//计算三角形左边点
			var point_a_l:Point2D = new Point2D(point_h_l.x*2-point_h_r.x,point_h_l.y*2-point_h_r.y);
			//计算三角形右边点
			var point_a_r:Point2D = new Point2D(point_h_r.x*2-point_h_l.x,point_h_r.y*2-point_h_l.y);
			
			
			this.addPart([point_l,point_h_l,point_a_l,pointE,point_a_r,point_h_r,point_r]);
			
		}
		/**
		 * 有三个或三个以上的控制点时
		 */
		private function calculateMorePoints():void
		{
			//计算箭头总长度
			var l:Number = 0;
			//计算直箭头的宽
			var w:Number = 0;
			for(var i:int = 0;i<this._controlPoints.length-1;i++)
			{
				//取出首尾两个点
				var pointS:Point2D = _controlPoints[i] as Point2D;
				var pointE:Point2D = _controlPoints[i+1] as Point2D;
				l += Math.sqrt((pointE.y-pointS.y)*(pointE.y-pointS.y)+(pointE.x-pointS.x)*(pointE.x-pointS.x));
			}
			w = l/this._ratio;
			
			var a:Number = Math.atan(w/(2*l));
			
			//定义左右控制点集合
			var points_C_l:Array = [];
			var points_C_r:Array = [];
			//定义尾部左右的起始点
			var point_t_l:Point2D;
			var point_t_r:Point2D;
			
			
			//计算中间的所有交点
			for(var j:int = 0;j<this._controlPoints.length-2;j++)
			{
				var pointU_1:Point2D = this._controlPoints[j] as Point2D;//第一个用户传入的点
				var pointU_2:Point2D = this._controlPoints[j+1] as Point2D;//第二个用户传入的点
				var pointU_3:Point2D = this._controlPoints[j+2] as Point2D;//第三个用户传入的点
				
				//计算向量
				var v_U_1_2:Point2D = new Point2D(pointU_2.x-pointU_1.x,pointU_2.y-pointU_1.y);
				var v_U_2_3:Point2D = new Point2D(pointU_3.x-pointU_2.x,pointU_3.y-pointU_2.y);
			
				
				//定义左边第一个控制点
				var point_l_1:Point2D;
				//定义右边第一个控制点
				var point_r_1:Point2D;
				//如果j=0时，左右第一个控制点需要计算
				if(j == 0)
				{
					var v_lr_:Array = this.calculateVector(v_U_1_2,Math.PI/2,w/2);
					//获取左边尾部点
					var v_l_:Point2D = v_lr_[0] as Point2D;
					//获取右边尾部点
					var v_r_:Point2D = v_lr_[1] as Point2D;
					//获取左边尾部点
					point_t_l = point_l_1 = new Point2D(v_l_.x+pointU_1.x,v_l_.y+pointU_1.y);
					//获取右边尾部点
					point_t_r = point_r_1 = new Point2D(v_r_.x+pointU_1.x,v_r_.y+pointU_1.y);
				}
				//否则获取上一次的记录
				else
				{
					point_l_1 = points_C_l[points_C_l.length-1];
					point_r_1 = points_C_r[points_C_r.length-1];
				}
				var v_lr:Array = this.calculateVector(v_U_1_2,a,1);
				//这里的向量需要反过来
				//获取左边向量
				var v_l:Point2D = v_lr[1] as Point2D;
				//获取右边向量
				var v_r:Point2D = v_lr[0] as Point2D;
				//定义角平分线向量
				var v_angularBisector:Point2D = this.calculateAngularBisector(new Point2D(-v_U_1_2.x,-v_U_1_2.y),v_U_2_3);
				//求交点
				//计算左边第二个控制点
				var point_l_2:Point2D = this.calculateIntersection(v_l,v_angularBisector,point_l_1,pointU_2);
				var point_r_2:Point2D = this.calculateIntersection(v_r,v_angularBisector,point_r_1,pointU_2);
				
				
				//添加后面的拐角控制点
				points_C_l.push(new Point2D((point_l_1.x+point_l_2.x)/2,(point_l_1.y+point_l_2.y)/2));
				points_C_l.push(point_l_2);
				points_C_r.push(new Point2D((point_r_1.x+point_r_2.x)/2,(point_r_1.y+point_r_2.y)/2));
				points_C_r.push(point_r_2);
			}
			
			//进入计算头部
			//计算一下头部的长度
			var pointU_E2:Point2D = this._controlPoints[this._controlPoints.length-2] as Point2D;//倒数第二个用户点
			var pointU_E1:Point2D = this._controlPoints[this._controlPoints.length-1] as Point2D;//最后一个用户点
			var head_d:Number = Math.sqrt((pointU_E2.x-pointU_E1.x)*(pointU_E2.x-pointU_E1.x) + (pointU_E2.y-pointU_E1.y)*(pointU_E2.y-pointU_E1.y));
			//定义头部的左右两结束点
			var point_h_l:Point2D;
			var point_h_r:Point2D;
			//三角形左右两点数组
			var point_lr_t:Array;
			//定义曲线最后一个控制点，也就是头部结束点和最后一个拐角点的中点
			var point_C_l_e:Point2D;
			var point_C_r_e:Point2D;
			//定义三角形的左右两个点
			var point_triangle_l:Point2D;
			var point_triangle_r:Point2D;
			
			//获取当前的最后的控制点，也就是之前计算的拐角点
			var point_C_l_eq:Point2D = points_C_l[points_C_l.length-1] as Point2D;
			var point_C_r_eq:Point2D = points_C_r[points_C_r.length-1] as Point2D;
			//申明三角形的两边向量
			var v_l_t:Point2D;
			var v_r_t:Point2D; 
			//三角的高度都不够
			if(head_d <= w)
			{
				point_lr_t = this.calculateVector(new Point2D(pointU_E1.x-pointU_E2.x,pointU_E1.y-pointU_E2.y),Math.PI/2,w/2);
				//获取三角形左右两个向量
				v_l_t = point_lr_t[0] as Point2D;
				v_r_t = point_lr_t[1] as Point2D;
				
				point_h_l = new Point2D(v_l_t.x/this._ratio+pointU_E2.x,v_l_t.y/this._ratio+pointU_E2.y);
				point_h_r = new Point2D(v_r_t.x/this._ratio+pointU_E2.x,v_r_t.y/this._ratio+pointU_E2.y);
				//计算三角形的左右两点
				point_triangle_l = new Point2D(point_h_l.x*2-point_h_r.x,point_h_l.y*2-point_h_r.y);
				point_triangle_r = new Point2D(point_h_r.x*2-point_h_l.x,point_h_r.y*2-point_h_l.y);
				
	
				//计算最后的控制点
				point_C_l_e = new Point2D((point_C_l_eq.x+point_h_l.x)/2,(point_C_l_eq.y+point_h_l.y)/2);
				point_C_r_e = new Point2D((point_C_r_eq.x+point_h_r.x)/2,(point_C_r_eq.y+point_h_r.y)/2);
				
				//添加最后的控制点（中心点）
				points_C_l.push(point_C_l_e);
				points_C_r.push(point_C_r_e);
				
				
				
			}
				//足够三角的高度
			else
			{
				//由于够了三角的高度，所以首先去掉三角的高度
				
				//计算向量
				var v_E2_E1:Point2D = new Point2D(pointU_E1.x-pointU_E2.x,pointU_E1.y-pointU_E2.y);
				//取模
				var v_E2_E1_d:Number = Math.sqrt(v_E2_E1.x*v_E2_E1.x+v_E2_E1.y*v_E2_E1.y);
				//首先需要计算三角形的底部中心点
				var point_c:Point2D = new Point2D(pointU_E1.x-v_E2_E1.x*w/v_E2_E1_d,pointU_E1.y-v_E2_E1.y*w/v_E2_E1_d);
				
				//计算出在三角形上底边上头部结束点
				point_lr_t = this.calculateVector(new Point2D(pointU_E1.x-point_c.x,pointU_E1.y-point_c.y),Math.PI/2,w/2);
				//获取三角形左右两个向量
				v_l_t = point_lr_t[0] as Point2D;
				v_r_t = point_lr_t[1] as Point2D;
				
				point_h_l = new Point2D(v_l_t.x/this._ratio+point_c.x,v_l_t.y/this._ratio+point_c.y);
				point_h_r = new Point2D(v_r_t.x/this._ratio+point_c.x,v_r_t.y/this._ratio+point_c.y);
				//计算三角形的左右两点
				point_triangle_l = new Point2D(point_h_l.x*2-point_h_r.x,point_h_l.y*2-point_h_r.y);
				point_triangle_r = new Point2D(point_h_r.x*2-point_h_l.x,point_h_r.y*2-point_h_l.y);
				
				
				
				//计算最后的控制点
				point_C_l_e = new Point2D((point_C_l_eq.x+point_h_l.x)/2,(point_C_l_eq.y+point_h_l.y)/2);
				point_C_r_e = new Point2D((point_C_r_eq.x+point_h_r.x)/2,(point_C_r_eq.y+point_h_r.y)/2);
				
				//添加最后的控制点（中心点）
				points_C_l.push(point_C_l_e);
				points_C_r.push(point_C_r_e);
				
			}
			//使用控制点计算差值
			//计算贝塞尔的控制点
			var points_BC_l:Array = GeoLine.createBezier2(points_C_l).parts[0];
			var points_BC_r:Array = GeoLine.createBezier2(points_C_r).parts[0];
			//组合左右点集和三角形三个点
			var pointsR:Array = [point_t_l];
			//首先连接左边的差值曲线
			pointsR = pointsR.concat(points_BC_l);
			//添加左边头部结束点
			pointsR.push(point_h_l);
			//添加三角形左边点
			pointsR.push(point_triangle_l);
			//添加三角形顶点
			pointsR.push(pointU_E1);
			//添加三角形右边点
			pointsR.push(point_triangle_r);
			//添加右边头部结束点
			pointsR.push(point_h_r);
			//合并右边的所有点
			for(var k:Number = points_BC_r.length-1;k>=0;k--)
			{
				pointsR.push(points_BC_r[k]);
			}
			//添加右边尾部起始点
			pointsR.push(point_t_r);
			this.addPart(pointsR);
			
		}
		
		/**
		 * 将军标符号斜箭头对象转换为json数据（解析了控制点和长宽比值）
		 * @return 返回的字符串
		 */
		override public function toJSON():String
		{
			if(!this._controlPoints)
			{
				return null;
			}
			var result:String = "";
			var len:int = this._controlPoints.length;
			var arr:Array = [];
			for(var i:int = 0;i<len;i++)
			{
				var point:Point2D = this._controlPoints[i] as Point2D;
				arr.push(point.toJsonString());
			}
			result = "{\"controlPoints\":["+arr.join(",")+"],\"ratio\":"+this._ratio+"}";
			return result;
		}
		
		/**
		 * 重写clone方法，必须深赋值
		 * @return 返回几何对象
		 */
		override public function clone():Geometry
		{
			var geoDiagonalArrow:GeoDiagonalArrow=new GeoDiagonalArrow();
			var controlPoints:Array = [];
			//这里只需要赋值控制点
			for(var i:int = 0,len:int = this._controlPoints.length;i<len;i++)
			{
				//这里必须深赋值，不然在编辑时由于引用的问题出现错误
				controlPoints.push((this._controlPoints[i] as Point2D).clone());
			}
			geoDiagonalArrow.ratio = this._ratio;
			geoDiagonalArrow.controlPoints = controlPoints;
			return geoDiagonalArrow;			
		}
		
		/**
		 * 根据json数据转换为GeoDiagonalArrow对象
		 * @param str json数据
		 * @return 返回的GeoDiagonalArrow对象
		 */
		public static function fromJSON(str:String):GeoDiagonalArrow
		{
			var geoDiagonalArrow:GeoDiagonalArrow = new GeoDiagonalArrow();
			//匹配长宽比例
			var r:String = str.match(/"ratio":([0-9]+)/)[1];
			geoDiagonalArrow.ratio = parseInt(r);
			//匹配控制点的数据
			var s:String = str.match(/"controlPoints":(\[.*?\])/)[1];
			var arr:Array = GeoPlotting.getControlPointsFromJSON(s);
			geoDiagonalArrow.controlPoints = arr;
			return geoDiagonalArrow;
		}
		
	}
}