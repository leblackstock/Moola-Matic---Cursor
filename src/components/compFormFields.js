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

// Add this function at the top of your component or in a utility file
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const FormFields = React.memo(function FormFields({
  item,
  updateItem,
  handleSubmit,
  handleSaveDraft,
  handlePurchaseRecommendationChange,
  itemId,
  analysisResult,
}) {
  const [hasPopulatedFields, setHasPopulatedFields] = useState(false);
  const previousAnalysisResultRef = useRef();
  const [updatedFields, setUpdatedFields] = useState(new Set());

  // Memoize the debouncedSave function
  const debouncedSave = useMemo(
    () =>
      _.debounce((newItem) => {
        handleSaveDraft(itemId, newItem);
      }, 1000),
    [handleSaveDraft, itemId]
  );

  // Optimize the main useEffect
  useEffect(() => {
    if (
      analysisResult &&
      analysisResult.summary &&
      analysisResult !== previousAnalysisResultRef.current
    ) {
      console.log('Processing analysis result:', analysisResult);
      previousAnalysisResultRef.current = analysisResult;

      // Create a new item object with updated fields
      const updatedItem = { ...item };

      // Update form fields based on the analysis result summary
      Object.entries(analysisResult.summary).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          console.log(`Updating ${key} to`, value);
          updatedItem[key] = value;
        }
      });

      // Handle specific fields that might need special processing
      if (analysisResult.summary.purchaseRecommendation) {
        updatedItem.purchaseRecommendation =
          analysisResult.summary.purchaseRecommendation;
        handlePurchaseRecommendationChange(
          analysisResult.summary.purchaseRecommendation
        );
      }

      // Handle date fields
      [
        'purchaseDate',
        'listingDate',
        'inventoryDetailsAcquisitionDate',
      ].forEach((dateField) => {
        if (analysisResult.summary[dateField]) {
          updatedItem[dateField] = formatDate(
            analysisResult.summary[dateField]
          );
        }
      });

      // Handle numeric fields
      [
        'financialsEstimatedMarketValue',
        'financialsPurchasePrice',
        'financialsTotalRepairAndCleaningCosts',
        'conditionEstimatedCleaningCosts',
        'conditionEstimatedRepairCosts',
        'marketAnalysisSuggestedListingPrice',
        'marketAnalysisMinimumAcceptablePrice',
      ].forEach((numField) => {
        if (analysisResult.summary[numField]) {
          updatedItem[numField] = parseFloat(analysisResult.summary[numField]);
        }
      });

      // Update the item state with all the changes at once
      updateItem(updatedItem);

      setHasPopulatedFields(true);
      setUpdatedFields(new Set(Object.keys(updatedItem)));
    }
  }, [analysisResult, updateItem, item, handlePurchaseRecommendationChange]);

  // Modify the handleFieldChange function
  const handleFieldChange = useCallback(
    (field, value) => {
      let formattedValue = value;

      // If the field is a date field, format the value
      if (
        field === 'purchaseDate' ||
        field === 'listingDate' ||
        field === 'soldDate'
      ) {
        formattedValue = formatDate(value);
      }

      const newItem = { ...item, [field]: formattedValue };
      updateItem(itemId, newItem);
      setUpdatedFields(new Set([...updatedFields, field]));
      debouncedSave(newItem);
    },
    [item, itemId, updateItem, updatedFields, debouncedSave, formatDate]
  );

  // Memoize the renderField function
  const renderField = useCallback(
    (key, label, type = 'text') => {
      const value = item[key];
      if (value === null || value === undefined || value === '') {
        return null;
      }

      let inputElement;
      switch (type) {
        case 'textarea':
          inputElement = (
            <StyledTextarea
              id={key}
              value={value}
              onChange={(e) => handleFieldChange(key, e.target.value)}
              rows="3"
            />
          );
          break;
        case 'number':
          inputElement = (
            <StyledInput
              type="number"
              id={key}
              value={value}
              onChange={(e) =>
                handleFieldChange(key, parseFloat(e.target.value))
              }
            />
          );
          break;
        case 'date':
          inputElement = (
            <StyledInput
              type="date"
              id={key}
              value={
                value instanceof Date
                  ? value.toISOString().split('T')[0]
                  : value
              }
              onChange={(e) => handleFieldChange(key, e.target.value)}
            />
          );
          break;
        case 'boolean':
          inputElement = (
            <StyledSelect
              id={key}
              value={value.toString()}
              onChange={(e) =>
                handleFieldChange(key, e.target.value === 'true')
              }
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </StyledSelect>
          );
          break;
        default:
          inputElement = (
            <StyledInput
              type={type}
              id={key}
              value={value}
              onChange={(e) => handleFieldChange(key, e.target.value)}
            />
          );
      }

      return (
        <StyledFormGroup key={key}>
          <StyledLabel htmlFor={key}>{label}</StyledLabel>
          {inputElement}
        </StyledFormGroup>
      );
    },
    [item, handleFieldChange]
  );

  // Memoize the renderFieldGroup function
  const renderFieldGroup = useCallback(
    (title, fields) => {
      const renderedFields = fields
        .filter(([key]) => updatedFields.has(key) || item[key] != null)
        .map(([key, label, type]) => renderField(key, label, type))
        .filter(Boolean);
      if (renderedFields.length === 0) return null;
      return (
        <React.Fragment key={title}>
          <StyledTitle>{title}</StyledTitle>
          {renderedFields}
        </React.Fragment>
      );
    },
    [updatedFields, item, renderField]
  );

  // Memoize the fields
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
  }, [renderFieldGroup, item]);

  useEffect(() => {
    setHasPopulatedFields(memoizedFields.length > 0);
  }, [memoizedFields.length]);

  const renderSampleListing = useCallback(() => {
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
  }, [item.sampleForSaleListing, handleFieldChange]);

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();
      handleSubmit(itemId);
    },
    [handleSubmit, itemId]
  );

  return (
    <>
      <StyledForm onSubmit={onSubmit}>
        {memoizedFields}
        {renderSampleListing()}
        {hasPopulatedFields && (
          <>
            <StyledButton type="submit">Purchase Item</StyledButton>
            <StyledButton
              onClick={() => handleSaveDraft(itemId, item)}
              type="button"
            >
              Save Draft
            </StyledButton>
          </>
        )}
      </StyledForm>
      <StyledFormGroup>
        <StyledLabel>Item ID</StyledLabel>
        <div>{itemId || 'Not assigned yet'}</div>
      </StyledFormGroup>
    </>
  );
});

FormFields.propTypes = {
  item: PropTypes.object.isRequired,
  updateItem: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  handleSaveDraft: PropTypes.func.isRequired,
  handlePurchaseRecommendationChange: PropTypes.func.isRequired,
  itemId: PropTypes.string.isRequired,
  analysisResult: PropTypes.object,
};

export default FormFields;
