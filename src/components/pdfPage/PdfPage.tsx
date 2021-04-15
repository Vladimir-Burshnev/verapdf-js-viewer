import React, {FC, useCallback, useState, useRef, memo, useEffect, useContext,} from 'react';
import { Page } from 'react-pdf';
import { useIntersection } from 'use-intersection';
import styled from 'styled-components';
import _ from 'lodash';

import Bbox, {IBbox} from '../bbox/Bbox';
import { IPageProps } from './IPageProps';
import { ViewerContext } from '../viewerContext/ViewerContext';
import { AnyObject } from '../../types/generics';
import { parseMcidToBbox } from '../../services/bboxService';

import './pdfPage.scss';

interface IPdfPageProps extends IPageProps {
  bboxList?: IBbox[];
  defaultHeight?: number;
  defaultWidth?: number;
  structure?: AnyObject;
  onPageInViewport?(page: number, data: { isIntersecting?: boolean, intersectionRatio?: number }): void;
}

const StyledPdfPage = styled.div`
  min-height: ${(props: { height?: number, width?: number, scale: number }) => props.height ? props.height*props.scale + 'px' : 'auto'};
  min-width: ${(props: { height?: number, width?: number, scale: number }) => props.width ? props.width*props.scale + 'px' : 'auto'};
`;

const PdfPage: FC<IPdfPageProps> = (props) => {
  const { scrollIntoPage } = useContext(ViewerContext);
  const { bboxList = [], scale = 1 } = props;
  const intersectionRef = useRef(null);
  const [bboxes, setBboxes] = useState<IBbox[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [intersectionRatio, setIntersectionRatio] = useState(0);
  useIntersection(intersectionRef, {
    threshold: [.2, .4, .5, .6, .8, 1],
  }, (entry) => {
    if (isIntersecting !== entry.isIntersecting) {
      setIsIntersecting(entry.isIntersecting);
    }
    if (intersectionRatio !== entry.intersectionRatio) {
      setIntersectionRatio(entry.intersectionRatio);
    }
  });

  const onPageClick = useCallback(() => {
    props.onBboxClick?.(null);
  }, []);
  const onBboxClick = useCallback((index) => (e: Event) => {
    e.stopPropagation();
    props.onBboxClick?.({ index });
  }, [props.onBboxClick]);
  const onPageRenderSuccess = useCallback(() => {
    setIsRendered(true);
    props.onPageRenderSuccess?.();
  }, []);
  const onPageLoadSuccess = useCallback((page) => {
    setIsRendered(true);
    Promise.all([page.getOperatorList(), page.getAnnotations()]).then(([operatorList, annotations]) => {
      const positionData = operatorList.argsArray[operatorList.argsArray.length - 1];
      const bboxes = bboxList.map((bbox) => {
        if (bbox.mcidList) {
          bbox.location = parseMcidToBbox(bbox.mcidList, positionData, annotations);
        }

        return bbox;
      });
      setBboxes(bboxes);
    });
    props.onPageLoadSuccess?.(page);
  }, [bboxList]);

  useEffect(() => {
    if (!loaded && isIntersecting) {
      setLoaded(true);
    }
    props.onPageInViewport?.(props.page, { isIntersecting, intersectionRatio });
  }, [isIntersecting, intersectionRatio, loaded])
  useEffect(() => {
    if (scrollIntoPage === props.page) {
      (intersectionRef.current as unknown as HTMLElement)?.scrollIntoView();
    }
  }, [scrollIntoPage]);
  const isBboxSelected = (bbox: IBbox) => props.activeBboxIndex === bbox.index;

  return (
    <StyledPdfPage
      className="pdf-page pdf-page_rendered"
      data-page={props.page}
      onClick={onPageClick}
      height={!isRendered ? props.defaultHeight : undefined}
      width={!isRendered ? props.defaultWidth : undefined}
      scale={scale}
      ref={intersectionRef}
    >
      {loaded ? <>
        <Page
          pageNumber={props.page}
          error={props.pageError}
          height={props.height}
          width={props.width}
          loading={props.pageLoading}
          inputRef={props.inputRef}
          renderAnnotationLayer={props.renderAnnotationLayer}
          renderInteractiveForms={props.renderInteractiveForms}
          renderTextLayer={props.renderTextLayer}
          scale={props.scale}
          onLoadError={props.onPageLoadError}
          onLoadProgress={props.onPageLoadProgress}
          onLoadSuccess={onPageLoadSuccess}
          onRenderError={props.onPageRenderError}
          onRenderSuccess={onPageRenderSuccess}
          onGetAnnotationsSuccess={props.onGetAnnotationsSuccess}
          onGetAnnotationsError={props.onGetAnnotationsError}
          onGetTextSuccess={props.onGetTextSuccess}
          onGetTextError={props.onGetTextError}
        />
        {isRendered ? bboxes.map((bbox: IBbox, index) => (
          <Bbox key={index} bbox={bbox} onClick={onBboxClick(bbox.index)} selected={isBboxSelected(bbox)} scale={scale} />
        )) : null}
      </> : null}
    </StyledPdfPage>
  );
}

export default memo(PdfPage);
