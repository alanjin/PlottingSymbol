package web.actions
{
	import com.supermap.web.core.Feature;
	import com.supermap.web.core.Point2D;
	import web.geometry.GeoDoubleArrow;
	import com.supermap.web.core.styles.PredefinedFillStyle;
	import com.supermap.web.events.DrawEvent;
	import com.supermap.web.mapping.Map;
	import com.supermap.web.sm_internal;
	
	import flash.events.MouseEvent;
	import flash.geom.Point;
	import com.supermap.web.actions.DrawAction;
	
	use namespace sm_internal;
	/**
	 * 双箭头绘制类
	 * 用于快速绘制双箭头
	 */
	public class DrawDoubleArrow extends DrawAction
	{
		/**
		 * 定义双箭头字段
		 * 用于记录当前正在绘制的双箭头
		 */
		private var _geoDoubleArrow:GeoDoubleArrow;
		/**
		 * 用于存放用户在绘制时的实际控制点
		 */
		private var _pointC:Array;
		/**
		 * 构造函数
		 * @param map 初始化时需要关联的地图
		 */
		public function DrawDoubleArrow(map:Map)
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
			//初始化双箭头，多添加一个点
			this._geoDoubleArrow = new GeoDoubleArrow([point2D,point2D]);
			//记录当前的实际控制点
			this._pointC = [point2D,point2D];
			//设置风格
			this.tempFeature.style = this.style;
			//设置几何对象
			this.tempFeature.geometry = this._geoDoubleArrow;
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
			//修改最后一个控制点
			this._pointC[this._pointC.length-1] = point2D;
			//重置控制点
			this._geoDoubleArrow.controlPoints = this._pointC.concat();
			//刷新feature
			this.tempFeature.refresh();
			//触发。。。事件
			dispatchEvent(new DrawEvent(DrawEvent.DRAW_UPDATE, this.tempFeature));
			//当控制点为四个时，结束绘制
			if(this._pointC.length == 4)
			{
				this.actionStarted = false;
				event.stopPropagation();
				map.layerHolder.removeEventListener(MouseEvent.CLICK, this.onMouseNextClick);
				map.layerHolder.addEventListener(MouseEvent.CLICK, this.onMouseClick);
				
				this.endDraw(point2D);
			}
			//当控制点为三个时，计算出第四个点
			else if(this._pointC.length == 3)
			{
				var po1:Point2D = this._pointC[0] as Point2D;
				var po2:Point2D = this._pointC[1] as Point2D;
				var po3:Point2D = this._pointC[2] as Point2D;
				var po4:Point2D = new Point2D(po1.x+po3.x-po2.x,po1.y+po3.y-po2.y);
				this._geoDoubleArrow.controlPoints = [po1,po2,po3,po4];
				this._pointC.push(po4);
			}
			else
			{
				//点击第二次时
				this._pointC.push(point2D);
			}
			
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
			//更新最后一个控制点
			this._pointC[this._pointC.length-1] = point2D;
			
			//有三个控制点时，自动计算第四个控制点
			if(this._pointC.length == 3)
			{
				var po1:Point2D = this._pointC[0] as Point2D;
				var po2:Point2D = this._pointC[1] as Point2D;
				var po3:Point2D = this._pointC[2] as Point2D;
				var po4:Point2D = new Point2D(po1.x+po3.x-po2.x,po1.y+po3.y-po2.y);
				this._geoDoubleArrow.controlPoints = [po1,po2,po3,po4];
			}
			else
			{
				this._geoDoubleArrow.controlPoints = this._pointC;
			}
			
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
			//如果控制点少于4个直接返回
			if(this._pointC.length < 4)
			{
				return;
			}
			//获取第四个点作为结束点
			var endPoint:Point2D = this._pointC[3] as Point2D;
			//如果有四个控制点，代表是在第三个点处双击结束的，所以最后一个控制点需要计算
			if(this._pointC.length == 4)
			{
				var po1:Point2D = this._pointC[0] as Point2D;
				var po2:Point2D = this._pointC[1] as Point2D;
				var po3:Point2D = this._pointC[2] as Point2D;
				var po4:Point2D = new Point2D(po1.x+po3.x-po2.x,po1.y+po3.y-po2.y);
				this._geoDoubleArrow.controlPoints = [po1,po2,po3,po4];
			}
			
			//重置控制点
			this._geoDoubleArrow.controlPoints = this._pointC;
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