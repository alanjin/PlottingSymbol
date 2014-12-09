var isWinRT = (typeof Windows === "undefined") ? false : true;
{
    inputScript('geometry/GeoPlotting.js');
    inputScript('geometry/GeoCircle.js');
    inputScript('geometry/GeoCurveFlag.js');
    inputScript('geometry/GeoDiagonalArrow.js');
    inputScript('geometry/GeoDoubleArrow.js');
    inputScript('geometry/GeoRectFlag.js');
    inputScript('geometry/GeoStraightArrow.js');
    inputScript('geometry/GeoTriangleFlag.js');

    inputScript('Handler/Plotting.js');
    inputScript('Handler/CircleEx.js');
    inputScript('Handler/CurveFlag.js');
    inputScript('Handler/DiagonalArrow.js');
    inputScript('Handler/DoubleArrow.js');
    inputScript('Handler/RectFlag.js');
    inputScript('Handler/StraightArrow.js');
    inputScript('Handler/TriangleFlag.js');

    inputScript('Control/PlottingEdit.js');
}
function inputScript(inc){
    if (!isWinRT) {
        var script = '<' + 'script type="text/javascript" src="../iClientJavaScriptPlottingSymbols/PlottingSymbols/' + inc + '"' + '><' + '/script>';
        document.writeln(script);
    } else {
        var script = document.createElement("script");
        script.src = "../iClientJavaScriptPlottingSymbols/PlottingSymbols/" + inc;
        document.getElementsByTagName("HEAD")[0].appendChild(script);
    }
}
