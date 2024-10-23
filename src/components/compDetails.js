// frontend/src/components/compDetails.js

import React from 'react';
import PropTypes from 'prop-types';
import {
  ModalOverlay,
  ModalContent,
  WarningModalButton,
  StyledTextarea,
  TextContainer,
  AnimatedText,
  ButtonContainer,
} from './compStyles.js';

// Warning Modal Component
const AnalysisWarningModal = ({ onConfirm, onCancel }) => {
  return (
    <ModalOverlay>
      <ModalContent>
        <h2>
          <i className="fas fa-exclamation-triangle" style={{ color: '#ffd700' }}></i> Hold Up,
          Treasure Hunter!
        </h2>
        <AnimatedText delay="0.2s">
          <i className="fas fa-magic"></i>
          You haven't added any details to help Moola-Matic understand your find. A few extra
          details can help our AI treasure expert give you even better insights about your item's
          potential value!
        </AnimatedText>
        <AnimatedText delay="0.4s">
          <i className="fas fa-question-circle"></i>
          Want to proceed without adding any extra details?
        </AnimatedText>
        <ButtonContainer>
          <WarningModalButton onClick={onConfirm}>
            <i className="fas fa-check"></i> Yes, let's analyze!
          </WarningModalButton>
          <WarningModalButton onClick={onCancel}>
            <i className="fas fa-pen"></i> No, I'll add details
          </WarningModalButton>
        </ButtonContainer>
      </ModalContent>
    </ModalOverlay>
  );
};

// Details Component
const AnalysisDetails = ({ analysisDetails, setAnalysisDetails }) => {
  return (
    <TextContainer style={{ marginTop: '1em', marginBottom: '2em' }}>
      <AnimatedText delay="0.1s">
        <i className="fas fa-lightbulb"></i>
        Help Moola-Matic understand your treasure better!
      </AnimatedText>
      <div style={{ margin: '1rem 0' }}>
        <StyledTextarea
          value={analysisDetails}
          onChange={e => setAnalysisDetails(e.target.value)}
          placeholder={`✨ Share the Secrets of Your Treasure! ✨

🔍 CONDITION CHECK:
• Any signs of wear or damage?
• Previous repairs or restorations?
• Overall state (excellent, good, fair)?

🏷️ MARKINGS & BRANDS:
• Signatures or maker's marks?
• Labels, stamps, or serial numbers?
• Copyright or patent information?

📏 MEASUREMENTS:
• Length, width, height?
• Weight (if relevant)?
• Size category (small, medium, large)?

🎨 DISTINCTIVE FEATURES:
• Colors and patterns?
• Unique design elements?
• Special materials or finishes?

📅 AGE INDICATORS:
• Approximate era or period?
• Manufacturing techniques used?
• Style characteristics?

💎 MATERIALS:
• Main materials used?
• Any precious metals or stones?
• Quality of materials?

🔮 EXTRA INSIGHTS:
• Any interesting history?
• Similar items you've seen?
• Special features not covered above?

The more details you share, the better we can help uncover your item's true value! 💫`}
          style={{
            minHeight: '400px',
            maxHeight: '600px',
            padding: '20px',
            fontSize: '1em',
            lineHeight: '1.4',
          }}
        />
      </div>
    </TextContainer>
  );
};

AnalysisDetails.propTypes = {
  analysisDetails: PropTypes.string.isRequired,
  setAnalysisDetails: PropTypes.func.isRequired,
};

AnalysisWarningModal.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default AnalysisDetails;
