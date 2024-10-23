// frontend/src/components/CombineAnalyses.js

import React, { useState } from 'react';
import { combineImageAnalyses } from '../api/apiCombineAnalysis.js';

const CombineAnalyses = async analysisResults => {
  try {
    const combinedAnalysis = await combineImageAnalyses(analysisResults);
    return combinedAnalysis;
  } catch (error) {
    console.error('Error in CombineAnalyses:', error);
    throw error;
  }
};

export default CombineAnalyses;
