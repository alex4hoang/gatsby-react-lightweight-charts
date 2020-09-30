import React from "react";
import { createChart } from "lightweight-charts";
import equal from "fast-deep-equal";

const addSeriesFunctions = {
    candlestick: "addCandlestickSeries",
    line: "addLineSeries",
    area: "addAreaSeries",
    bar: "addBarSeries",
    histogram: "addHistogramSeries",
};

const seriesTypes = [
    {
        property: "candlestickSeries",
        type: "candlestick",
    },
    {
        property: "lineSeries",
        type: "line"
    },
    {
        property: "areaSeries",
        type: "area"
    },
    {
        property: "barSeries",
        type: "bar"
    },
    {
        property: "histogramSeries",
        type: "histogram"
    },
] ;

const darkTheme = {
    layout: {
        backgroundColor: "#131722",
        lineColor: "#2B2B43",
        textColor: "#D9D9D9",
    },
    grid: {
        vertLines: {
            color: "#363c4e",
        },
        horzLines: {
            color: "#363c4e",
        },
    },
};

const lightTheme = {
    layout: {
        backgroundColor: "#FFFFFF",
        lineColor: "#2B2B43",
        textColor: "#191919",
    },
    grid: {
        vertLines: {
            color: "#e1ecf2",
        },
        horzLines: {
            color: "#e1ecf2",
        },
    },
};

class ChartWrapper extends React.Component {
    constructor(props) {
        super(props);
        this.chartDiv = React.createRef();
        this.legendDiv = React.createRef();
        this.chart = null;
        this.series = [];
        this.legends = [];
        this.initTimeScale = true ;
    }

    componentDidMount() {
        this.chart = createChart(this.chartDiv.current);
        this.handleUpdateChart();
        this.resizeHandler();
    }

    componentDidUpdate(prevProps) {
        if (!this.props.autoWidth && !this.props.autoHeight)
            window.removeEventListener("resize", this.resizeHandler);

        if (
            !equal(
                [
                    prevProps.onCrosshairMove,
                    prevProps.onTimeRangeMove,
                    prevProps.onClick,
                ],
                [
                    this.props.onCrosshairMove,
                    this.props.onTimeRangeMove,
                    this.props.onClick,
                ]
            )
        )
            this.unsubscribeEvents(prevProps);

        if (
            !equal(
                [
                    prevProps.options,
                    prevProps.darkTheme,
                    prevProps.candlestickSeries,
                    prevProps.lineSeries,
                    prevProps.areaSeries,
                    prevProps.barSeries,
                    prevProps.histogramSeries,
                ],
                [
                    this.props.options,
                    this.props.darkTheme,
                    this.props.candlestickSeries,
                    this.props.lineSeries,
                    this.props.areaSeries,
                    this.props.barSeries,
                    this.props.histogramSeries,
                ]
            )
        ) 
            this.handleUpdateChart();

        if (
            prevProps.from !== this.props.from ||
            prevProps.to !== this.props.to ||
            this.initTimeScale
        ) {
            this.handleTimeRange();
            this.initTimeScale = false ;
        }
    }

    resizeHandler = () => {
        let width =
            this.props.autoWidth &&
            this.chartDiv.current &&
            this.chartDiv.current.parentNode.clientWidth;
        let height =
            this.props.autoHeight && this.chartDiv.current
                ? this.chartDiv.current.parentNode.clientHeight
                : this.props.height || 500;
        this.chart.resize(width, height);
    };

    addSeries = (serie, type) => {
        const addFunc = addSeriesFunctions[type];
        const series = this.chart[addFunc](serie.options);
        series.setData(serie.data);
        if (serie.markers) series.setMarkers(serie.markers);
        if (serie.priceLines)
            serie.priceLines.forEach((line) => series.createPriceLine(line));
        if (serie.legend) this.addLegend(series, serie.options.color, serie.legend);
        return series;
    };

    handleSeries = () => {
        let prevSeries = this.series;
        let props = this.props;

        let newSeries = [] ;

        seriesTypes.forEach((seriesType)=>{

            props[ seriesType.property ] &&
                props[ seriesType.property ].forEach((typeSeries) => {

                    let iPrevRecord = -1 ;
                    if( typeSeries.id )
                        iPrevRecord = prevSeries.findIndex( r => 
                            ( r.id && ( r.id === typeSeries.id ) ) ) ;

                    if( iPrevRecord >= 0 ) {
                        const prevRecord = prevSeries[ iPrevRecord ] ;

                        prevRecord.seriesApi.applyOptions( typeSeries.options ) ;
                        prevRecord.seriesApi.setData( typeSeries.data ) ;
                        
                        newSeries.push( prevRecord ) ;
                        prevSeries.splice( iPrevRecord, 1 ) ;
                    }
                    else
                        newSeries.push({
                            id: typeSeries.id,
                            seriesApi: this.addSeries(typeSeries, seriesType.type)
                        });
                });
        }) ;

        prevSeries.forEach( series => {
            this.chart.removeSeries( series.seriesApi ) ;
            if( series.legend ) {
                let iLegend = this.legends.findIndex(legend => (series.legend === legend.title)) ;
                if( iLegend >= 0 )
                    this.legends.splice( iLegend, 1 ) ;
            }
        }) ;

        this.series = newSeries ;
    };

    unsubscribeEvents = (prevProps) => {
        let chart = this.chart;
        chart.unsubscribeClick(prevProps.onClick);
        chart.unsubscribeCrosshairMove(prevProps.onCrosshairMove);
        chart.unsubscribeVisibleTimeRangeChange(prevProps.onTimeRangeMove);
    };

    handleEvents = () => {
        let chart = this.chart;
        let props = this.props;
        props.onClick && chart.subscribeClick(props.onClick);
        props.onCrosshairMove &&
            chart.subscribeCrosshairMove(props.onCrosshairMove);
        props.onTimeRangeMove &&
            chart.subscribeVisibleTimeRangeChange(props.onTimeRangeMove);

        // handle legend dynamical change
        chart.subscribeCrosshairMove(this.handleLegends);
    };

    handleTimeRange = () => {
        let { from, to } = this.props;
        from && to && this.chart.timeScale().setVisibleRange({ from, to });
    };

    handleUpdateChart = () => {
        window.removeEventListener("resize", this.resizeHandler);
        let { chart, chartDiv } = this;
        let props = this.props;
        let options = props.darkTheme ? darkTheme : lightTheme;
        options = mergeDeep(options, {
            width: props.autoWidth
                ? chartDiv.current.parentNode.clientWidth
                : props.width,
            height: props.autoHeight
                ? chartDiv.current.parentNode.clientHeight
                : props.height || 500,
            ...props.options,
        });
        chart.applyOptions(options);
        if (this.legendDiv.current) this.legendDiv.current.innerHTML = "";
        if (props.legend) this.handleMainLegend();

        this.handleSeries();
        this.handleEvents();

        if (props.autoWidth || props.autoHeight)
            // resize the chart with the window
            window.addEventListener("resize", this.resizeHandler);
    };

    addLegend = (series, color, title) => {
        this.legends.push({ series, color, title });
    };

    handleLegends = (param) => {
        let div = this.legendDiv.current;
        if (param.time && div && this.legends.length) {
            div.innerHTML = "";
            this.legends.forEach(({ series, color, title }) => {
                let price = param.seriesPrices.get(series);
                if (price !== undefined) {
                    if (typeof price == "object") {
                        color =
                            price.open < price.close
                                ? "rgba(0, 150, 136, 0.8)"
                                : "rgba(255,82,82, 0.8)";
                        price = `O: ${price.open}, H: ${price.high}, L: ${price.low}, C: ${price.close}`;
                    }
                    let row = document.createElement("div");
                    row.innerText = title + " ";
                    let priceElem = document.createElement("span");
                    priceElem.style.color = color || "rgba(0, 150, 136, 0.8)";
                    priceElem.innerText = " " + price;
                    row.appendChild(priceElem);
                    div.appendChild(row);
                }
            });
        }
    };

    handleMainLegend = () => {
        if (this.legendDiv.current) {
            let row = document.createElement("div");
            row.innerText = this.props.legend;
            this.legendDiv.current.appendChild(row);
        }
    };

    render() {
        let color = this.props.darkTheme
            ? darkTheme.layout.textColor
            : lightTheme.layout.textColor;

        return (
            <div ref={this.chartDiv} style={{ position: "relative" }}>
                <div
                    ref={this.legendDiv}
                    style={{
                        position: "absolute",
                        zIndex: 2,
                        color,
                        padding: 10,
                    }}
                />
            </div>
        );
    }
}

export default ChartWrapper;
export * from "lightweight-charts";

const isObject = (item) =>
    item && typeof item === "object" && !Array.isArray(item);

const mergeDeep = (target, source) => {
    let output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach((key) => {
            if (isObject(source[key])) {
                if (!(key in target))
                    Object.assign(output, { [key]: source[key] });
                else output[key] = mergeDeep(target[key], source[key]);
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
};
