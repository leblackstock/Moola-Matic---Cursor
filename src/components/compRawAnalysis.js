// frontend/src/components/compRawAnalysis.js

import React from 'react';
import PropTypes from 'prop-types';
import { SummaryContainer, SummaryTitle, SummaryText } from './compStyles.js';

const RawAnalysisSummary = ({ rawAnalysis }) => {
  console.log('RawAnalysisSummary rendering, rawAnalysis:', rawAnalysis);

  if (!rawAnalysis) {
    console.log('No rawAnalysis provided, not rendering RawAnalysisSummary');
    return null;
  }

  let formattedAnalysis;
  try {
    formattedAnalysis =
      typeof rawAnalysis === 'string'
        ? rawAnalysis
        : JSON.stringify(rawAnalysis, null, 2);
  } catch (error) {
    console.error('Error formatting raw analysis:', error);
    formattedAnalysis = 'Error formatting raw analysis';
  }

  return (
    <SummaryContainer>
      <SummaryTitle>Raw Analysis Summary</SummaryTitle>
      <SummaryText>{formattedAnalysis}</SummaryText>
    </SummaryContainer>
  );
};

RawAnalysisSummary.propTypes = {
  rawAnalysis: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
};

export default RawAnalysisSummary;
