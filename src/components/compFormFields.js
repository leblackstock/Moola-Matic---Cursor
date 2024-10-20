// frontend/src/components/compFormFields.js

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash'; // Import the full lodash library
import {
  StyledForm,
  StyledFormGroup,
  StyledLabel,
  StyledInput,
  StyledSelect,
  StyledTextarea,
  StyledButton,
  StyledTitle,
} from './compStyles.js';

function FormFields({
  item,
  updateItem,
  handleSubmit,
  handleSaveDraft,
  handlePurchaseRecommendationChange,
  itemId,
  analysisResult,
  aiRecommendation,
}) {
  console.log('FormFields render start');

  const [hasPopulatedFields, setHasPopulatedFields] = useState(false);
  const previousAnalysisResultRef = useRef();
  const [updatedFields, setUpdatedFields] = useState(new Set());

  // Debounce the save function to avoid too frequent saves
  const debouncedSave = useCallback(
    _.debounce((newItem) => {
      handleSaveDraft(itemId, newItem);
    }, 1000),
    [handleSaveDraft, itemId]
  );

  useEffect(() => {
    console.log('FormFields effect triggered');
    if (analysisResult) {
      console.log('Processing analysisResult:', analysisResult);
      if (
        analysisResult &&
        analysisResult !== previousAnalysisResultRef.current
      ) {
        console.log('Processing new analysisResult');
        previousAnalysisResultRef.current = analysisResult;

        if (analysisResult.summary) {
          console.log('Processing summary:', analysisResult.summary);

          let summaryObject;
          try {
            // Remove markdown formatting if present
            const cleanedSummary = analysisResult.summary
              .replace(/```json\n/, '') // Remove opening ```json
              .replace(/\n```$/, '') // Remove closing ```
              .trim(); // Remove any leading/trailing whitespace

            summaryObject = JSON.parse(cleanedSummary);
          } catch (error) {
            console.error('Error parsing summary:', error);
            summaryObject = {};
          }

          // Create a new item object with updated fields
          const updatedItem = { ...item };

          // Update form fields based on the analysis result
          Object.entries(summaryObject).forEach(([key, value]) => {
            if (value !== undefined) {
              console.log(`Updating ${key} to ${value}`);
              updatedItem[key] = value;
            }
          });

          // Update the item state with all the changes at once
          updateItem(updatedItem);

          setHasPopulatedFields(true);
        }
      }
    }
  }, [analysisResult, updateItem, item]);

  const handleFieldChange = useCallback(
    (key, value) => {
      console.log('handleFieldChange called', key, value);
      console.log(`Updating field: ${key} with value: ${value}`);
      const newItem = { ...item, [key]: value };
      updateItem(key, value);
      debouncedSave(newItem);
      setUpdatedFields((prev) => new Set(prev).add(key));
    },
    [item, updateItem, debouncedSave]
  );

  const renderField = (key, label, type = 'text') => {
    const value = item[key];
    console.log(`Rendering field: ${key}, value: ${value}`);
    if (value === null || value === undefined || value === '') {
      console.log(`Skipping render for empty field: ${key}`);
      return null;
    }

    return (
      <StyledFormGroup key={key}>
        <StyledLabel htmlFor={key}>{label}</StyledLabel>
        {type === 'textarea' ? (
          <StyledTextarea
            id={key}
            value={value}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            rows="3"
          />
        ) : type === 'number' ? (
          <StyledInput
            type="number"
            id={key}
            value={value}
            onChange={(e) => handleFieldChange(key, parseFloat(e.target.value))}
          />
        ) : type === 'date' ? (
          <StyledInput
            type="date"
            id={key}
            value={
              value instanceof Date ? value.toISOString().split('T')[0] : value
            }
            onChange={(e) => handleFieldChange(key, e.target.value)}
          />
        ) : type === 'boolean' ? (
          <StyledSelect
            id={key}
            value={value.toString()}
            onChange={(e) => handleFieldChange(key, e.target.value === 'true')}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </StyledSelect>
        ) : (
          <StyledInput
            type={type}
            id={key}
            value={value}
            onChange={(e) => handleFieldChange(key, e.target.value)}
          />
        )}
      </StyledFormGroup>
    );
  };

  const renderFieldGroup = useCallback(
    (title, fields) => {
      const renderedFields = fields
        .filter(([key]) => updatedFields.has(key) || item[key] != null)
        .map(([key, label, type]) => renderField(key, label, type))
        .filter(Boolean);
      if (renderedFields.length === 0) return null;
      return (
        <>
          <StyledTitle>{title}</StyledTitle>
          {renderedFields}
        </>
      );
    },
    [updatedFields, item, renderField]
  );

  const memoizedFields = useMemo(() => {
    const fieldGroups = [
      [
        'Basic Item Information',
        [
          ['name', 'Item Name'],
          ['brand', 'Brand'],
          ['make', 'Make'],
          ['model', 'Model'],
          ['serialNumber', 'Serial Number'],
          ['type', 'Type'],
          ['description', 'Description', 'textarea'],
          ['category', 'Category'],
          ['subcategory', 'Subcategory'],
          ['style', 'Style'],
          ['vintage', 'Vintage', 'boolean'],
          ['antique', 'Antique', 'boolean'],
          ['rarity', 'Rarity'],
          ['packagingAccessoriesIncluded', 'Packaging/Accessories Included'],
          ['materialComposition', 'Material Composition'],
        ],
      ],
      [
        'Clothing Measurements',
        [
          ['clothingMeasurementsSizeLabel', 'Size Label'],
          ['clothingMeasurementsChestBust', 'Chest/Bust'],
          ['clothingMeasurementsWaist', 'Waist'],
          ['clothingMeasurementsHips', 'Hips'],
          ['clothingMeasurementsShoulderWidth', 'Shoulder Width'],
          ['clothingMeasurementsSleeveLength', 'Sleeve Length'],
          ['clothingMeasurementsInseam', 'Inseam'],
          ['clothingMeasurementsTotalLength', 'Total Length'],
        ],
      ],
      [
        'Footwear Measurements',
        [
          ['footwearMeasurementsSize', 'Size'],
          ['footwearMeasurementsWidth', 'Width'],
          ['footwearMeasurementsInsoleLength', 'Insole Length'],
          ['footwearMeasurementsHeelHeight', 'Heel Height'],
          ['footwearMeasurementsPlatformHeight', 'Platform Height'],
          ['footwearMeasurementsBootShaftHeight', 'Boot Shaft Height'],
          ['footwearMeasurementsCalfCircumference', 'Calf Circumference'],
        ],
      ],
      [
        'Jewelry Measurements',
        [
          ['jewelryMeasurementsRingSize', 'Ring Size'],
          [
            'jewelryMeasurementsNecklaceBraceletLength',
            'Necklace/Bracelet Length',
          ],
          ['jewelryMeasurementsPendantDimensions', 'Pendant Dimensions'],
          ['jewelryMeasurementsJewelryDimensions', 'Jewelry Dimensions'],
        ],
      ],
      [
        'Furniture and Large Item Measurements',
        [
          ['furnitureLargeItemMeasurementsHeight', 'Height'],
          ['furnitureLargeItemMeasurementsWidth', 'Width'],
          ['furnitureLargeItemMeasurementsDepth', 'Depth'],
          ['furnitureLargeItemMeasurementsLength', 'Length'],
          ['furnitureLargeItemMeasurementsSeatHeight', 'Seat Height'],
          [
            'furnitureLargeItemMeasurementsTabletopDimensions',
            'Tabletop Dimensions',
          ],
        ],
      ],
      [
        'General Measurements',
        [
          ['generalMeasurementsWeight', 'Weight'],
          ['generalMeasurementsDiameter', 'Diameter'],
          ['generalMeasurementsVolumeCapacity', 'Volume/Capacity'],
          [
            'generalMeasurementsOtherSpecificMeasurements',
            'Other Specific Measurements',
          ],
        ],
      ],
      [
        'Condition',
        [
          ['conditionRating', 'Condition Rating'],
          ['conditionSignsOfWear', 'Signs of Wear'],
          ['conditionDetailedNotes', 'Detailed Notes', 'textarea'],
          ['conditionRepairNeeds', 'Repair Needs'],
          ['conditionCleaningRequirements', 'Cleaning Requirements'],
          ['conditionEstimatedRepairCosts', 'Estimated Repair Costs', 'number'],
          [
            'conditionEstimatedCleaningCosts',
            'Estimated Cleaning Costs',
            'number',
          ],
          [
            'conditionTimeSpentOnRepairsCleaning',
            'Time Spent on Repairs/Cleaning',
          ],
        ],
      ],
      [
        'Financials',
        [
          ['financialsPurchasePrice', 'Purchase Price', 'number'],
          [
            'financialsTotalRepairAndCleaningCosts',
            'Total Repair and Cleaning Costs',
            'number',
          ],
          [
            'financialsEstimatedShippingCosts',
            'Estimated Shipping Costs',
            'number',
          ],
          ['financialsPlatformFees', 'Platform Fees', 'number'],
          ['financialsExpectedProfit', 'Expected Profit', 'number'],
          ['financialsProfitMargin', 'Profit Margin', 'number'],
          [
            'financialsEstimatedMarketValue',
            'Estimated Market Value',
            'number',
          ],
          ['financialsAcquisitionCost', 'Acquisition Cost', 'number'],
        ],
      ],
      [
        'Market Analysis',
        [
          ['marketAnalysisMarketDemand', 'Market Demand'],
          ['marketAnalysisHistoricalPriceTrends', 'Historical Price Trends'],
          ['marketAnalysisMarketSaturation', 'Market Saturation'],
          ['marketAnalysisSalesVelocity', 'Sales Velocity'],
          [
            'marketAnalysisSuggestedListingPrice',
            'Suggested Listing Price',
            'number',
          ],
          [
            'marketAnalysisMinimumAcceptablePrice',
            'Minimum Acceptable Price',
            'number',
          ],
        ],
      ],
      [
        'Additional Information',
        [
          ['itemCareInstructions', 'Item Care Instructions', 'textarea'],
          ['keywordsForSeo', 'Keywords for SEO', 'textarea'],
          ['lotOrBundleInformation', 'Lot or Bundle Information'],
          ['customizableFields', 'Customizable Fields'],
          ['recommendedSalePlatforms', 'Recommended Sale Platforms'],
        ],
      ],
      [
        'Compliance',
        [
          ['compliancePlatformPolicies', 'Platform Policies'],
          ['complianceAuthenticityMarkers', 'Authenticity Markers'],
          ['complianceCounterfeitRisk', 'Counterfeit Risk'],
          ['complianceStatus', 'Compliance Status'],
          ['complianceRestrictedItemCheck', 'Restricted Item Check'],
        ],
      ],
      [
        'Inventory Details',
        [
          ['inventoryDetailsInventoryId', 'Inventory ID'],
          ['inventoryDetailsStorageLocation', 'Storage Location'],
          ['inventoryDetailsAcquisitionDate', 'Acquisition Date', 'date'],
          ['inventoryDetailsTargetMarket', 'Target Market'],
          ['inventoryDetailsTrendingItems', 'Trending Items'],
          ['inventoryDetailsCustomerPreferences', 'Customer Preferences'],
          ['inventoryDetailsAcquisitionLocation', 'Acquisition Location'],
          ['inventoryDetailsSupplierInformation', 'Supplier Information'],
        ],
      ],
      [
        'Dates',
        [
          ['purchaseDate', 'Purchase Date', 'date'],
          ['listingDate', 'Listing Date', 'date'],
        ],
      ],
      [
        'Additional Notes',
        [
          ['sellerNotes', 'Seller Notes', 'textarea'],
          ['contextData', 'Context Data', 'textarea'],
        ],
      ],
      [
        'Final Recommendation',
        [
          ['detailedBreakdown', 'Detailed Breakdown', 'textarea'],
          ['sampleForSaleListing', 'Sample For Sale Listing', 'textarea'],
        ],
      ],
    ];

    return fieldGroups
      .map(([title, fields]) => renderFieldGroup(title, fields))
      .filter(Boolean);
  }, [renderFieldGroup]);

  useEffect(() => {
    setHasPopulatedFields(memoizedFields.length > 0);
  }, [memoizedFields.length]);

  const renderPurchaseRecommendation = () => {
    if (
      !item.purchaseRecommendation ||
      item.purchaseRecommendation === 'Unknown'
    )
      return null;
    return (
      <StyledFormGroup>
        <StyledLabel htmlFor="purchaseRecommendation">
          Purchase Recommendation
        </StyledLabel>
        <StyledSelect
          id="purchaseRecommendation"
          value={item.purchaseRecommendation}
          onChange={(e) => handlePurchaseRecommendationChange(e.target.value)}
        >
          <option value="Yes">Yes</option>
          <option value="No">No</option>
          <option value="Unknown">Unknown</option>
        </StyledSelect>
      </StyledFormGroup>
    );
  };

  const renderSampleListing = () => {
    if (!item.sampleForSaleListing) return null;
    return (
      <StyledFormGroup>
        <StyledTitle>Sample For Sale Listing</StyledTitle>
        <StyledTextarea
          value={item.sampleForSaleListing}
          onChange={(e) =>
            handleFieldChange('sampleForSaleListing', e.target.value)
          }
          rows="10"
          readOnly
        />
      </StyledFormGroup>
    );
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleSubmit(itemId);
  };

  console.log('FormFields render end');

  return (
    <>
      <StyledForm onSubmit={onSubmit}>
        {memoizedFields}
        {renderPurchaseRecommendation()}
        {renderSampleListing()} {/* Add this line */}
        {hasPopulatedFields && (
          <>
            <StyledButton type="submit">Purchase Item</StyledButton>
            <StyledButton onClick={() => handleSaveDraft(itemId, item)}>
              Save Draft
            </StyledButton>
          </>
        )}
      </StyledForm>
      <StyledFormGroup>
        <StyledLabel>Item ID</StyledLabel>
        <div>{itemId || 'Not assigned yet'}</div>
      </StyledFormGroup>
      <div>
        <label>AI Recommendation:</label>
        <p>
          {aiRecommendation?.purchaseRecommendation !== undefined
            ? `Purchase Recommendation: ${aiRecommendation.purchaseRecommendation ? 'Yes' : 'No'}`
            : 'No recommendation available'}
        </p>
        {aiRecommendation?.explanation && (
          <p>Explanation: {aiRecommendation.explanation}</p>
        )}
      </div>
    </>
  );
}

FormFields.propTypes = {
  item: PropTypes.object.isRequired,
  updateItem: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  handleSaveDraft: PropTypes.func.isRequired,
  handlePurchaseRecommendationChange: PropTypes.func.isRequired,
  itemId: PropTypes.string.isRequired,
  analysisResult: PropTypes.object,
  aiRecommendation: PropTypes.object,
};

export default FormFields;
