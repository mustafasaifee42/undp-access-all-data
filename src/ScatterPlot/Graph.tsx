import React, { useEffect, useRef, useState } from 'react';
import { DataType, HoverDataType, HoverRowDataType, OptionsDataType } from '../Types';
import { scaleLinear } from 'd3-scale';
import { getRange } from '../Utils/getRange';
import { select } from 'd3-selection';
import { getColor } from '../Utils/getColor';
import { brush } from 'd3-brush';
import { HoverTooltip } from '../Components/HoverTooltip';
import { axisBottom, axisLeft } from 'd3-axis';
import styled from 'styled-components';
import domtoimage from 'dom-to-image';
import { ColorScale } from '../Components/ColorScale';
import { Tick } from '../Icons';

interface Props {
  data: DataType[];
  firstMetric: OptionsDataType;
  secondMetric: OptionsDataType;
  colorMetric: OptionsDataType;
  sizeMetric: OptionsDataType;
}

const TopSettings = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1rem 0;
`;

const FlexDiv = styled.div`
  display: flex;
`;

const Button = styled.button`
	padding: 2rem;
	border-radius: 0.2rem;
	font-size: 1.4rem;
  font-weight: 700;
	background-color: var(--bg-blue);
  color: var(--navy);
  border: 0;
  text-transform: uppercase;
  margin: 0 1rem;
  cursor: pointer;
  border-radius: 100px;
  padding: 1rem 3rem;
  &:hover {
    background: #B6D3FE;
  }
  &:active{
    background: #84B5FD;
  }
`;


const CheckboxEl = styled.div`
	display: flex;
	margin: 0.8rem 1rem;
	align-items: center;
  cursor: pointer;
`;

interface CheckboxDataType {
	selected: boolean;
}

const Checkbox = styled.div<CheckboxDataType>`
	width: 1.4rem;
	height: 1.4rem;
	border: 2px solid ${props => props.selected ? 'var(--navy)': 'var(--grey-c3)'};
  border-radius: 0.2rem;
	margin-right: 1rem;
	background-color: ${props => props.selected ? 'var(--navy)': 'var(--white)'};
	&:hover {
		border: 2px solid var(--navy);
	};
`;

const CheckboxValue = styled.div`
	font-size: 1.2rem;
	font-weight: 400;
	margin-top: 0.2rem;
  text-transform: uppercase;
`;

export const Graph = (props: Props) => {
  const {
    data,
    firstMetric,
    secondMetric,
    colorMetric,
    sizeMetric,
  } = props;

  const [hoverInfo, setHoverInfo] = useState<HoverDataType | null>(null);
  const [showLabel, setShowLabel] = useState(false);
  const GraphRef = useRef(null);
  const ResetButtonRef = useRef(null);
  useEffect(() => {
    if (GraphRef.current && GraphRef !== null) {
      
      const graphDiv = select(GraphRef.current);
      graphDiv.selectAll('svg').remove();
      const width = 1280;
      const height = 720;
      const margin = {
        top: 20,
        bottom: 40,
        left: 50,
        right:20,
      };
      

      const svg = graphDiv
        .append('svg')
        .attr('width', '100%')
        .attr('viewBox',`0 0 ${width} ${height}`);
    
      const graphWidth = width - margin.left - margin.right;
      const graphHeight = height - margin.top - margin.bottom;
    
      const radiusScale = sizeMetric.Indicator !== 'Not Selected' ?  scaleLinear().domain(getRange(data,sizeMetric.Indicator)).range([0,20]) : undefined;
      const radius = 5;
      
      const xScale = scaleLinear().domain(getRange(data,firstMetric.Indicator)).range([0, graphWidth]).nice();
      const yScale = scaleLinear().domain(getRange(data,secondMetric.Indicator)).range([graphHeight,0]).nice();
      const colorDomain = !colorMetric.Categorical ?  getRange(data,colorMetric.Indicator, true) : null;
      const updateChart = (event: any) => {
        if (!event.sourceEvent) return;
        const extent = event.selection;
        if (extent) {
          xScale.domain([
            xScale.invert(extent[0][0]),
            xScale.invert(extent[1][0]),
          ]);
          yScale.domain([
            yScale.invert(extent[1][1]),
            yScale.invert(extent[0][1]),
          ]);
          xAxis.transition().call(axisBottom(xScale).ticks(5).tickSize(-1 * graphHeight)).call((g) => g.select('.domain').remove())
            .call(g => g.selectAll('.tick line')
              .style('stroke', 'var(--medium-grey)')
              .attr('stroke-dasharray', '4,8'))
            .call(g => g.selectAll('.tick text')
              .style('fill', 'var(--navy)')
              .attr('font-weight', 700));
          yAxis.transition().call(axisLeft(yScale).ticks(5).tickSize(-1 * graphWidth)).call((g) => g.select('.domain').remove())
            .call(g => g.selectAll('.tick line')
              .style('stroke', 'var(--medium-grey)')
              .attr('stroke-dasharray', '4,8'))
            .call(g => g.selectAll('.tick text')
              .style('fill', 'var(--navy)')
              .attr('font-weight', 700));
          mainGraph
            .selectAll('.dataPoints')
            .transition()
            .attr('transform',(d: any) => `translate(${xScale(d.Indicators[d.Indicators.findIndex((el: any) => el.Indicator === firstMetric.Indicator)].Value)},${yScale(d.Indicators[d.Indicators.findIndex((el: any) => el.Indicator === secondMetric.Indicator)].Value)})`);            
        }
        mainGraph.call(brushing.move, null);
      };

      
      const brushing = brush()
        .extent([
          [0, 0],
          [graphWidth, graphHeight],
        ])
        .on('end', updateChart);
      svg
        .append('defs')
        .append('svg:clipPath')
        .attr('id', 'clip')
        .append('svg:rect')
        .attr('width', graphWidth)
        .attr('height', graphHeight)
        .attr('x', 0)
        .attr('y', 0);
      const mainGraph = svg
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)
        .call(brushing);
      const graphExtra = svg
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
      graphExtra.append('line')
        .attr('x1',0)
        .attr('x2',0)
        .attr('y1',0)
        .attr('y2', graphHeight)
        .attr('stroke-width',1)
        .attr('stroke','#110848');
      graphExtra.append('line')
        .attr('x1',0)
        .attr('x2',graphWidth)
        .attr('y1',graphHeight)
        .attr('y2', graphHeight)
        .attr('stroke-width',1)
        .attr('stroke','#110848');
      graphExtra.append('text')
        .attr('transform', `translate(${graphWidth / 2},${graphHeight + 30})`)
        .attr('x',0)
        .attr('y',0)
        .attr('fill', '#110848')
        .attr('font-size',14)
        .attr('font-weight','700')
        .attr('text-anchor','middle')
        .text(firstMetric.Indicator);
      graphExtra.append('text')
        .attr('transform', `translate(-30,${graphHeight / 2}) rotate(-90)`)
        .attr('x',0)
        .attr('y',0)
        .attr('fill', '#110848')
        .attr('font-size',14)
        .attr('font-weight','700')
        .attr('text-anchor','middle')
        .text(secondMetric.Indicator);
      const xAxis = mainGraph
        .append('g')
        .style('font-size', '12px')
        .style('color', 'var(--grey)')
        .attr('transform', `translate(0,${graphHeight})`)
        .call(axisBottom(xScale).ticks(5).tickSize(-1 * graphHeight))
        .call((g) => g.select('.domain').remove())
        .call(g => g.selectAll('.tick line')
          .style('stroke', 'var(--medium-grey)')
          .attr('stroke-dasharray', '4,8'))
        .call(g => g.selectAll('.tick text')
          .style('fill', 'var(--navy)')
          .attr('font-weight', 700));
      const yAxis = mainGraph
        .append('g')
        .style('font-size', '12px')
        .style('color', 'var(--grey)')
        .call(axisLeft(yScale).ticks(5).tickSize(-1 * graphWidth))
        .call((g) => g.select('.domain').remove())
        .call(g => g.selectAll('.tick line')
          .style('stroke', 'var(--medium-grey)')
          .attr('stroke-dasharray', '4,8'))
        .call(g => g.selectAll('.tick text')
          .style('fill', 'var(--navy)')
          .attr('font-weight', 700));
      const dataPointsG = mainGraph.append('g')
        .attr('clip-path', 'url(#clip)');
      dataPointsG.selectAll('.dataPoints')
        .data(data)
        .enter()
        .append('g')
        .attr('class','dataPoints')
        .attr('transform',d => `translate(${xScale(d.Indicators[d.Indicators.findIndex(el => el.Indicator === firstMetric.Indicator)].Value)},${yScale(d.Indicators[d.Indicators.findIndex(el => el.Indicator === secondMetric.Indicator)].Value)})`)
        .on('mouseover',(event, d) => {
          const rowData: HoverRowDataType[] = [
            {
              title: firstMetric.Indicator,
              value: d.Indicators[d.Indicators.findIndex(el => el.Indicator === firstMetric.Indicator)].Value,
            },
            {
              title: secondMetric.Indicator,
              value: d.Indicators[d.Indicators.findIndex(el => el.Indicator === secondMetric.Indicator)].Value,
            }
          ];
          if(sizeMetric.Indicator !== 'Not Selected') {
            rowData.push({
              title: sizeMetric.Indicator,
              value: d.Indicators[d.Indicators.findIndex(el => el.Indicator === sizeMetric.Indicator)].Value,
            });
          }
          if(colorMetric.Indicator !== 'Not Selected' && colorMetric.Indicator !== 'Continents') {
            rowData.push({
              title: colorMetric.Indicator,
              value: d.Indicators.findIndex(el => el.Indicator === colorMetric.Indicator) >= 0 ? d.Indicators[d.Indicators.findIndex(el => el.Indicator === colorMetric.Indicator)].Value : 'NA',
            });
          }
          setHoverInfo({
            country: d['Country or Area'],
            continent:d['Group 1'],
            rows: rowData,
            xPosition: event.clientX,
            yPosition: event.clientY,
          });
        })
        .on('mousemove',(event, d) => {
          const rowData: HoverRowDataType[] = [
            {
              title: firstMetric.Indicator,
              value: d.Indicators[d.Indicators.findIndex(el => el.Indicator === firstMetric.Indicator)].Value,
            },
            {
              title: secondMetric.Indicator,
              value: d.Indicators[d.Indicators.findIndex(el => el.Indicator === secondMetric.Indicator)].Value,
            }
          ];
          if(colorMetric.Indicator !== 'Not Selected' && colorMetric.Indicator !== 'Continents') {
            rowData.push({
              title: colorMetric.Indicator,
              value: d.Indicators.findIndex(el => el.Indicator === colorMetric.Indicator) >= 0 ? d.Indicators[d.Indicators.findIndex(el => el.Indicator === colorMetric.Indicator)].Value : 'NA',
            });
          }
          if(sizeMetric.Indicator !== 'Not Selected') {
            rowData.push({
              title: sizeMetric.Indicator,
              value: d.Indicators[d.Indicators.findIndex(el => el.Indicator === sizeMetric.Indicator)].Value,
            });
          }

          
          setHoverInfo({
            country: d['Country or Area'],
            continent:d['Group 1'],
            rows: rowData,
            xPosition: event.clientX,
            yPosition: event.clientY,
          });
        })
        .on('mouseout', () => {
          setHoverInfo(null);
        });
        
      mainGraph
        .selectAll('.dataPoints')
        .append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', (d:any) => radiusScale ? radiusScale(d.Indicators[d.Indicators.findIndex((el: any) => el.Indicator === sizeMetric.Indicator)].Value) : radius)
        .attr('fill', (d:any) => getColor(d, colorMetric, colorDomain))
        .attr('fill-opacity',0.9)
        .attr('stroke-width',0.5)
        .attr('stroke','#919399');
      mainGraph
        .selectAll('.dataPoints')
        .append('text')
        .attr('class','textLabels')
        .attr('x', 0)
        .attr('y', 0)
        .attr('font-size', '8px')
        .attr('dy','3px')
        .attr('dx', (d:any) => radiusScale ? radiusScale(d.Indicators[d.Indicators.findIndex((el: any) => el.Indicator === sizeMetric.Indicator)].Value) + 3 : radius + 3)
        .attr('font-weight','600')
        .attr('fill', (d:any) => getColor(d, colorMetric, colorDomain))
        .style('display','none')
        .text((d:any) => d['Alpha-2 code']);
      if (ResetButtonRef.current && ResetButtonRef !== null) {
        const buttonDiv = select(ResetButtonRef.current);
        buttonDiv.on('click', () => {
          xScale.domain(getRange(data,firstMetric.Indicator)).range([0, graphWidth]).nice();
          yScale.domain(getRange(data,secondMetric.Indicator)).range([graphHeight, 0]).nice();
          xAxis.transition().call(axisBottom(xScale).ticks(5).tickSize(-1 * graphHeight)).call((g) => g.select('.domain').remove())
            .call(g => g.selectAll('.tick line')
              .style('stroke', 'var(--medium-grey)')
              .attr('stroke-dasharray', '4,8'))
            .call(g => g.selectAll('.tick text')
              .style('fill', 'var(--navy)')
              .attr('font-weight', 700));
          yAxis.transition().call(axisLeft(yScale).ticks(5).tickSize(-1 * graphWidth)).call((g) => g.select('.domain').remove())
            .call(g => g.selectAll('.tick line')
              .style('stroke', 'var(--medium-grey)')
              .attr('stroke-dasharray', '4,8'))
            .call(g => g.selectAll('.tick text')
              .style('fill', 'var(--navy)')
              .attr('font-weight', 700));
          mainGraph
            .selectAll('.dataPoints')
            .transition()
            .attr('transform',(d: any) => `translate(${xScale(d.Indicators[d.Indicators.findIndex((el: any) => el.Indicator === firstMetric.Indicator)].Value)},${yScale(d.Indicators[d.Indicators.findIndex((el: any) => el.Indicator === secondMetric.Indicator)].Value)})`);            
          
        });}
    }
  }, [ResetButtonRef, GraphRef, data, firstMetric, secondMetric, sizeMetric, colorMetric]);

  useEffect(() => {
    if (GraphRef.current && GraphRef !== null) {
      const graphDiv = select(GraphRef.current);
      if(showLabel) graphDiv.selectAll('.textLabels').style('display','inline');
      else graphDiv.selectAll('.textLabels').style('display','none');
    }
  }, [showLabel, GraphRef]);

  return (<>
    <TopSettings>
      {
        colorMetric.Indicator !== 'Not Selected' ?
          <ColorScale 
            colorMetric = {colorMetric} 
            colorDomain = {!colorMetric.Categorical ? getRange(data,colorMetric.Indicator, true) : [0,0]} 
          /> : <div style={{height:'7.2rem'}}/>
      }
      <FlexDiv>
        <CheckboxEl onClick={() => {setShowLabel(!showLabel);}}>
          <Checkbox selected={showLabel ? true : false}>
            {
              showLabel ? <Tick size={12} fill={'#ffffff'} />: null
            }
          </Checkbox>
          <CheckboxValue>Show Labels</CheckboxValue>
        </CheckboxEl>
        <Button ref={ResetButtonRef}>Reset Zoom</Button>
        <Button 
          onClick={() => {
          // tslint:disable-next-line: no-floating-promises
            domtoimage
              .toPng(document.getElementById('graph-node') as HTMLElement)
              .then((dataUrl: any) => {
                const link = document.createElement('a');
                link.download = 'graph.png';
                link.href = dataUrl;
                link.click();
              });
          }}>Download Image</Button>
      </FlexDiv>
    </TopSettings>
    <div ref={GraphRef} id="graph-node" />
    {
      hoverInfo ? 
        <HoverTooltip data={hoverInfo}/>
        : null
    }
  </>
  );
};