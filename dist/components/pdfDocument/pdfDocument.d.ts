import React from 'react';
import { IDocumentProps } from './IDocumentProps';
import { IPageProps } from '../pdfPage/IPageProps';
import { IBboxLocation } from '../../index';
import './pdfDocument.scss';
export interface IPdfDocumentProps extends IDocumentProps, IPageProps {
    showAllPages?: boolean;
    activeBboxIndex?: number;
    bboxes: IBboxLocation[];
    onPageChange?(page: number): void;
}
declare const _default: React.NamedExoticComponent<IPdfDocumentProps>;
export default _default;
