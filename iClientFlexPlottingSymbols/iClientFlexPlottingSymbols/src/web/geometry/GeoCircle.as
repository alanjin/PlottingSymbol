package web.geometry
{
	import com.supermap.web.core.Point2D;
	import com.supermap.web.core.geometry.Geometry;

	/**
	 * 圆
	 * 使用圆心和圆上一点绘制出一个圆
	 */
	public class GeoCircle extends GeoPlotting
	{
		/**
		 * 构造函数
		 * @param points 需要传入的控制点（理论上应该是两个），默认为null 
		 */
		public function GeoCircle(points:Array=null)
		{
			super(points);
		}
		/**
		 * 重写了父类的方法
		 * 用于通过中点和边缘点计算圆的边缘360个点，组成一个圆
		 */
		override protected function calculateParts():void
		{
			//清空原有的所有点
			this.parts = new Array();
			//至少需要两个控制点，其欧式也只需要两个
			if(this._controlPoints.length>1)
			{
				//取第一个作为中心点
				var centerPoint:Point2D = this._controlPoints[0] as Point2D;
				//取最后一个作为半径控制点
				var radiusPoint:Point2D = this._controlPoints[this._controlPoints.length-1] as Point2D;
				var parts:Array = [];
				//计算圆的半径
				var radius:Number = Math.sqrt((radiusPoint.x - centerPoint.x) * (radiusPoint.x - centerPoint.x) + 
					(radiusPoint.y - centerPoint.y) * (radiusPoint.y - centerPoint.y));
				//计算圆的边缘所有点
				for(var i:int = 0; i < 360; i++)
				{
					var radians:Number = (i + 1) * Math.PI / 180;
					var circlePoint:Point2D = new Point2D(Math.cos(radians) * radius + centerPoint.x, Math.sin(radians) * radius + centerPoint.y);
					parts[i] = circlePoint;
				}
				//设置点集
				this.addPart(parts);
			}
		}
		/**
		 * 将军标符号圆对象转换为json数据（只解析了控制点）
		 * @return 返回的字符串
		 */
		override public function toJSON():String
		{
			return super.toJSON();
		}
		/**
		 * 重写clone方法，必须深赋值
		 * @return 返回几何对象
		 */
		override public function clone():Geometry
		{
			var geoCircle:GeoCircle=new GeoCircle();
			var controlPoints:Array = [];
			//这里只需要赋值控制点
			for(var i:int = 0,len:int = this._controlPoints.length;i<len;i++)
			{
				//这里必须深赋值，不然在编辑时由于引用的问题出现错误
				controlPoints.push((this._controlPoints[i] as Point2D).clone());
			}
			geoCircle.controlPoints = controlPoints;
			return geoCircle;			
		}
		/**
		 * 根据json数据转换为GeoCircle对象
		 * @param str json数据
		 * @return 返回的GeoCircle对象
		 */
		public static function fromJSON(str:String):GeoCircle
		{
			var geoCircle:GeoCircle = new GeoCircle();
			//匹配控制点的数据
			//取第二个代表获取括号内匹配的
			var s:String = str.match(/"controlPoints":(\[.*?\])/)[1];
			var arr:Array = GeoPlotting.getControlPointsFromJSON(s);
			geoCircle.controlPoints = arr;
			return geoCircle;
		}
	}
}