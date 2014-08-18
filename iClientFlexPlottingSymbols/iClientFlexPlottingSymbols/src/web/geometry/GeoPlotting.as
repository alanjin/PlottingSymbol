package web.geometry
{
	import com.supermap.web.core.Point2D;
	import com.supermap.web.sm_internal;
	import com.supermap.web.core.geometry.GeoRegion;
	import com.supermap.web.core.geometry.Geometry;
	
	use namespace sm_internal;
	/**
	 * 标绘扩展符号基类
	 * 所有标绘扩展符号需要继承此类，这样才能统一管理编辑操作（通过控制点数组来控制）
	 * 此基类提供了很多常用算法，在子类中可以直接使用
	 */
	public class GeoPlotting extends GeoRegion
	{
		/**
		 * 定义控制点字段
		 * 用于存储标绘扩展符号的所有控制点
		 */
		protected var _controlPoints:Array;
		/**
		 * 构造函数
		 * @param points 需要传入的控制点，默认为null 
		 */
		public function GeoPlotting(points:Array = null)
		{
			super();
			this.controlPoints = points;
		}
		/**
		 * 获取控制点
		 * @return 返回控制点数组
		 */
		public function get controlPoints():Array
		{
			return _controlPoints;
		}
		/**
		 * 设置控制点
		 * @param value 需要设置的控制点数组
		 */
		public function set controlPoints(value:Array):void
		{
			if(value)
			{
				_controlPoints = value;
				this.calculateParts();
			}
		}
		/**
		 * 重写clone方法，必须深赋值
		 * @return 返回几何对象
		 */
		override public function clone():Geometry
		{
			var geoState:GeoPlotting=new GeoPlotting();
			var controlPoints:Array = [];
			//这里只需要赋值控制点
			for(var i:int = 0,len:int = this._controlPoints.length;i<len;i++)
			{
				//这里必须深赋值，不然在编辑时由于引用的问题出现错误
				controlPoints.push((this._controlPoints[i] as Point2D).clone());
			}
			geoState.controlPoints = controlPoints;
			return geoState;			
		}
		/**
		 * 将标绘扩展对象转换为json数据（只解析了控制点）
		 * @return 返回的字符串
		 */
		public function toJSON():String
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
			result = "{\"controlPoints\":["+arr.join(",")+"]}";
			return result;
		}
		/**
		 * 根据控制点字符串获取控制点数据
		 * @param str 控制点字符串，形如："[{...},{...}...]"
		 * @return 返回控制点数组
		 */
		protected static function getControlPointsFromJSON(str:String):Array
		{
			var result:Array = [];
			//匹配每一个Point2D的json格式
			var r:RegExp = /{.*?}/g;
			var arr:Array = str.match(r);
			for(var i:int = 0,len:int = arr.length;i<len;i++)
			{
				result.push(Point2D.fromJson(arr[i] as String));
			}
			return result;
		}
		
		/**
		 * 通过控制点计算标绘扩展符号所有点
		 * 此方法需要子类重写实现
		 */
		protected function calculateParts():void
		{
		}
		/**
		 * 计算和基准向量v夹角为a、长度为d的目标向量（理论上有两个，一左一右）
		 * @param v 基准向量
		 * @param a 目标向量和基准向量的夹角，默认为90度，这里的单位使用弧度
		 * @param d 目标向量的长度，即模，默认为1，即单位向量
		 * @return 返回目标向量数组（就两个向量，一左一右）
		 */
		protected function calculateVector(v:Point2D,a:Number = Math.PI/2,d:Number = 1):Array
		{
			//定义目标向量的头部   x 坐标
			var x_1:Number;
			var x_2:Number;
			//定义目标向量的头部   y 坐标
			var y_1:Number;
			var y_2:Number;
			//定义目标向量，一左一右
			var v_l:Point2D;
			var v_r:Point2D;
			
			//计算基准向量v的模
			var d_v:Number = Math.sqrt(v.x*v.x+v.y*v.y);
			
			//基准向量的斜率为0时，y值不能作为除数，所以需要特别处理
			if(v.y == 0)
			{
				//计算x,会有两个值
				x_1 = x_2 = d_v*d*Math.cos(a)/v.x;
				//根据v.x的正负判断目标向量的左右之分
				if(v.x>0)
				{
					//计算y
					y_1 = Math.sqrt(d*d-x_1*x_1);
					y_2 = -y_1;
				}
				else if(v.x<0)
				{
					//计算y
					y_2 = Math.sqrt(d*d-x_1*x_1);
					y_1 = -y_2;
				}
				v_l = new Point2D(x_1,y_1);
				v_r = new Point2D(x_2,y_2);
			}
			//此为大多数情况
			else
			{
				//转换为y=nx+m形式
				var n:Number = -v.x/v.y;
				var m:Number = d*d_v*Math.cos(a)/v.y;
				//
				//x*x + y*y = d*d
				//转换为a*x*x + b*x + c = 0
				var a:Number = 1+n*n;
				var b:Number = 2*n*m;
				var c:Number = m*m - d*d;
				//计算x,会有两个值
				x_1 = (-b - Math.sqrt(b*b-4*a*c))/(2*a);
				x_2 = (-b + Math.sqrt(b*b-4*a*c))/(2*a);
				//计算y
				y_1 = n*x_1 + m;
				y_2 = n*x_2 + m;
				//当向量向上时
				if(v.y>=0)
				{
					v_l = new Point2D(x_1,y_1);
					v_r = new Point2D(x_2,y_2);
				}
				//当向量向下时
				else if(v.y<0)
				{
					v_l = new Point2D(x_2,y_2);
					v_r = new Point2D(x_1,y_1);
				}
			}
			return [v_l,v_r];
		}
		
		/**
		 * 计算两条直线的交点
		 * 通过向量的思想进行计算，需要提供两个向量以及两条直线上各自一个点
		 * @param v_1   直线1的向量
		 * @param v_2   直线2的向量
		 * @param points1   直线1上的任意一点
		 * @param points2   直线2上的任意一点
		 * @return 返回交点
		 */
		protected function calculateIntersection(v_1:Point2D,v_2:Point2D,point1:Point2D,point2:Point2D):Point2D
		{
			//定义交点的坐标
			var x:Number;
			var y:Number;
			//如果向量v_1和v_2平行
			if(v_1.y*v_2.x-v_1.x*v_2.y == 0)
			{
				//平行也有两种情况
				//同向
				if(v_1.x*v_2.x>0 || v_1.y*v_2.y>0)
				{
					//同向直接取两个点的中点
					x = (point1.x+point2.x)/2;
					y = (point1.y+point2.y)/2;
				}
					//反向
				else
				{
					//如果反向直接返回后面的点位置
					x = point2.x;
					y = point2.y;
				}
			}
			else
			{
				//
				x = (v_1.x*v_2.x*(point2.y-point1.y)+point1.x*v_1.y*v_2.x-point2.x*v_2.y*v_1.x)/(v_1.y*v_2.x-v_1.x*v_2.y);
				if(v_1.x!=0)
				{
					y = (x-point1.x)*v_1.y/v_1.x+point1.y;
				}
					//不可能v_1.x和v_2.x同时为0
				else
				{
					y = (x-point2.x)*v_2.y/v_2.x+point2.y;
				}
			}
			return new Point2D(x,y);
		}
		
		/**
		 * 计算两个向量的角平分线向量
		 * @param v1 向量1
		 * @param v2 向量2
		 * @return 返回角平分线向量 
		 */
		protected function calculateAngularBisector(v1:Point2D,v2:Point2D):Point2D
		{
			//计算角平分线的思想是取两个向量的单位向量，然后相加
			var d1:Number = Math.sqrt(v1.x*v1.x+v1.y*v1.y);
			var d2:Number = Math.sqrt(v2.x*v2.x+v2.y*v2.y);
			return new Point2D(v1.x/d1+v2.x/d2,v1.y/d1+v2.y/d2);
		}
		
		/**
		 * 通过三角形的底边两端点坐标以及底边两夹角，计算第三个点坐标
		 * @param pointS 底边第一个点
		 * @param pointE 底边第二个点
		 * @param a_S 底边和第一个点所在的另一条边的夹角
		 * @param a_E 底边和第二个点所在的另一条边的夹角
		 * @return 返回顶点（理论上存在两个值）
		 */
		protected function calculateIntersectionFromTwoCorner(pointS:Point2D,pointE:Point2D,a_S:Number = Math.PI/4,a_E:Number = Math.PI/4):Array
		{
			//起始点、结束点、交点加起来三个点，形成一个三角形
			//斜边（起始点到结束点）的向量为
			var v_SE:Point2D = new Point2D(pointE.x-pointS.x,pointE.y-pointS.y);
			//计算起始点、交点的单位向量
			var v_SI_lr:Array = this.calculateVector(v_SE,a_S,1);
			//获取
			var v_SI_l:Point2D = v_SI_lr[0] as Point2D;
			var v_SI_r:Point2D = v_SI_lr[1] as Point2D;
			//计算结束点、交点的单位向量
			var v_EI_lr:Array = this.calculateVector(v_SE,Math.PI-a_S,1);
			//获取
			var v_EI_l:Point2D = v_EI_lr[0] as Point2D;
			var v_EI_r:Point2D = v_EI_lr[1] as Point2D;
			//求左边的交点
			var pointI_l:Point2D = this.calculateIntersection(v_SI_l,v_EI_l,pointS,pointE);
			//计算右边的交点
			var pointI_r:Point2D = this.calculateIntersection(v_SI_r,v_EI_r,pointS,pointE);
			return [pointI_l,pointI_r];
		}
	}
}