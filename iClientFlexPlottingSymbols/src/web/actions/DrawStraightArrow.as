package web.actions
{
	import com.supermap.web.core.Feature;
	import com.supermap.web.core.Point2D;
	import web.geometry.GeoStraightArrow;
	import com.supermap.web.core.styles.PredefinedFillStyle;
	import com.supermap.web.events.DrawEvent;
	import com.supermap.web.mapping.Map;
	import com.supermap.web.sm_internal;
	
	import flash.events.MouseEvent;
	import flash.geom.Point;
	import com.supermap.web.actions.DrawAction;
	
	use namespace sm_internal;
	/**
	 * 直箭头绘制类
	 * 用于快速绘制直箭头
	 */
	public class DrawStraightArrow extends DrawAction
	{
		/**
		 * 定义直箭头字段
		 * 用于记录当前正在绘制的直箭头
		 */
		private var _geoStraightArrow:GeoStraightArrow;
		/**
		 * 构造函数
		 * @param map 初始化时需要关联的地图
		 */
		public function DrawStraightArrow(map:Map)
		{
			super(map);
			this.style = new PredefinedFillStyle();
		}
		/**
		 * 重写事件移除函数
		 */
		override sm_internal function removeMapListeners():void
		{
			super.removeMapListeners();
			//移除绘制中的点击事件
			map.layerHolder.removeEventListener(MouseEvent.CLICK, this.onMouseNextClick)
		}
		/**
		 * 绘制控件激活时，第一次点击地图触发的事件
		 * 
		 */
		override protected function onMouseClick(event:MouseEvent):void
		{
			//设置开始绘制
			this.actionStarted = true;
			//设置地图交点
			this.map.setFocus();
			//移除此自身事件，触发后不需要再次触发
			map.layerHolder.removeEventListener(MouseEvent.CLICK, this.onMouseClick);
			//注册中途点击事件，用于在绘制中一直添加控制点
			map.layerHolder.addEventListener(MouseEvent.CLICK, this.onMouseNextClick);
			//将像素点坐标转换为地理坐标
			var point2D:Point2D = this.map.stageToMap(new Point(event.stageX, event.stageY));
			//判断是否使用了捕捉功能
			if(this.snap)
			{
				//如果开启了捕捉，那么会进行捕捉转换
				point2D = this.snap.getSnapPoint(point2D);
			}
			//初始化绘制时在图层中需要显示的临时Feature
			this.tempFeature = new Feature();
			//开始绘制（父类的方法）
			startDraw(point2D);
			//初始化直箭头，多添加一个点
			this._geoStraightArrow = new GeoStraightArrow([point2D,point2D]);
			//设置风格
			this.tempFeature.style = this.style;
			//设置几何对象
			this.tempFeature.geometry = this._geoStraightArrow;
			//添加到临时图层中
			this.tempLayer.addFeature(this.tempFeature);
		}
		/**
		 * 中途添加控制点的事件
		 */
		private function onMouseNextClick(event:MouseEvent):void
		{
			//将像素点坐标转换为地理坐标
			var point2D:Point2D = this.map.stageToMap(new Point(event.stageX, event.stageY));
			//判断是否使用了捕捉功能
			if(this.snap)
			{
				//如果开启了捕捉，那么会进行捕捉转换
				point2D = this.snap.getSnapPoint(point2D);
			}
			//添加新的控制点
			this._geoStraightArrow.controlPoints.push(point2D);
			//重新设置控制点数组，触发绘制点计算
			this._geoStraightArrow.controlPoints = this._geoStraightArrow.controlPoints;
			//刷新feature
			this.tempFeature.refresh();
			//触发。。。事件
			dispatchEvent(new DrawEvent(DrawEvent.DRAW_UPDATE, this.tempFeature));
		}
		
		/**
		 * 绘制中途鼠标移动事件
		 * 
		 */
		override protected function onMouseMove(event:MouseEvent):void
		{
			//将像素点坐标转换为地理坐标
			var point2D:Point2D = this.map.stageToMap(new Point(event.stageX, event.stageY));
			//判断是否使用了捕捉功能
			if(this.snap)
			{
				//如果开启了捕捉，那么会进行捕捉转换
				point2D = this.snap.getSnapPoint(point2D);
			}
			//如果不在绘制中直接返回
			if (!this.actionStarted)
			{
				return;
			}
			//判断地图是否处于动画或平移中
			if (this.map.isTweening || this.map.isPanning)
			{
				return;
			}
			//直接跟换最后一个控制点
			this._geoStraightArrow.controlPoints[this._geoStraightArrow.controlPoints.length-1] = point2D;
			//重新设置控制点数组，触发绘制点计算
			this._geoStraightArrow.controlPoints = this._geoStraightArrow.controlPoints;
			//刷新feature
			this.tempFeature.refresh();
		}
		/**
		 * 双击地图结束绘制
		 * 
		 */
		override protected function onMouseDoubleClick(event:MouseEvent):void
		{
			//如果不在绘制中直接返回
			if (!this.actionStarted)
			{
				return;
			}
			//如果控制点少于两个，这返回
			if(this._geoStraightArrow.controlPoints.length < 2)
			{
				return;
			}
			//删除最后一个控制点（结束时最后一个是重复的控制点）
			var endPoint:Point2D = this._geoStraightArrow.controlPoints.pop();
			//重新设置控制点数组，触发绘制点计算
			this._geoStraightArrow.controlPoints = this._geoStraightArrow.controlPoints;
			//设置绘制处于结束
			this.actionStarted = false;
			event.stopPropagation();
			//移除绘制中的点击事件
			map.layerHolder.removeEventListener(MouseEvent.CLICK, this.onMouseNextClick);
			//重新注册绘制开始事件
			map.layerHolder.addEventListener(MouseEvent.CLICK, this.onMouseClick);
			//结束绘制
			this.endDraw(endPoint);
		}
	}
}