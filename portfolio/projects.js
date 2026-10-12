window.PORTFOLIO={
  "mammo": {
    "name": "Mammography-Based Breast Cancer Risk Prediction",
    "eyebrow": "Research / Mammography",
    "description": "Four-view mammography, cross-view attention, and time-to-event modeling for future breast cancer risk.",
    "image": "mammo-results.svg",
    "research": {
      "rows": [
        {
          "years": 1,
          "eligible_exams": 837,
          "positive_exams": 87,
          "negative_exams": 750,
          "historical_auc": 0.746
        },
        {
          "years": 2,
          "eligible_exams": 491,
          "positive_exams": 112,
          "negative_exams": 379,
          "historical_auc": 0.817
        },
        {
          "years": 3,
          "eligible_exams": 353,
          "positive_exams": 131,
          "negative_exams": 222,
          "historical_auc": 0.807
        },
        {
          "years": 4,
          "eligible_exams": 243,
          "positive_exams": 137,
          "negative_exams": 106,
          "historical_auc": 0.802
        }
      ],
      "reportSha256": "c85313ce1bcfe97d1e4ca2ac41ba4b85d258fe7ddc1aa308aa7af9a0f5607463"
    },
    "summary": "Learn an exam-level representation from routine screening mammograms and predict cumulative cancer risk over multiple follow-up horizons.",
    "metric": "1y 0.746 / 2y 0.817 / 3y 0.807 / 4y 0.802",
    "metricLabel": "Historical internal-validation AUC by horizon",
    "metricNote": "Each horizon is evaluated separately on exams with eligible follow-up.",
    "stack": [
      "Four-view mammography",
      "EfficientNetV2S + transformer",
      "Discrete-time survival"
    ],
    "methods": "A shared image encoder processes the four standard mammography views. A transformer combines their features into an exam representation, and a discrete-time survival head estimates cumulative risk.",
    "pipeline": [
      "LCC, LMLO, RCC and RMLO mammograms",
      "Shared grayscale EfficientNetV2S encoder",
      "View embeddings + transformer aggregation",
      "Five hazard outputs → cumulative risk"
    ],
    "methodDetails": [
      {
        "title": "Inputs and model",
        "text": "A shared, ImageNet-initialized EfficientNetV2S encodes LCC, LMLO, RCC and RMLO images into 1,280 features per view. View-type embeddings identify side and projection. A two-layer, eight-head transformer combines the views through a learned CLS token to form the exam representation."
      },
      {
        "title": "Training curriculum",
        "text": "Training starts with image-level auxiliary tasks, including acquisition metadata and cancer status. It then gradually increases exam-level risk supervision while tapering auxiliary losses. Follow-up eligibility determines which risk targets contribute; shorter-follow-up exams can still support auxiliary learning."
      },
      {
        "title": "Follow-up and risk",
        "text": "Five hazard probabilities produce cumulative risk through each horizon as one minus the product of survival probabilities up to that horizon. A cancer-free label requires sufficient follow-up; an observed diagnosis establishes positive labels from the corresponding horizon onward."
      },
      {
        "title": "Evaluation",
        "text": "The retained report describes patient-separated internal validation. AUC is reported separately for each eligible horizon, with its positive and negative exam counts. The displayed historical results are not a new evaluation of the current source; matched predictions are unavailable for recalculating confidence intervals."
      }
    ],
    "watch": "Reported cohort: 42,987 complete four-view exams from 33,488 patients. The horizon table shows the smaller eligible validation subsets.",
    "evidence": "The retained report records a patient-separated internal-validation design and AUCs of 0.746, 0.817, 0.807 and 0.802 at years 1–4. These are historical aggregate results; the original data and matched prediction/split artifacts are no longer available for a fresh audit or confidence-interval calculation.",
    "limits": "External validation, calibration and clinical utility remain unestablished. No superiority claim over another risk model is made.",
    "code": "https://github.com/michaelzenkay/mg-public",
    "codeStatus": "Public source: mg-public",
    "sourceNote": "The linked source includes the image encoder, cross-view transformer, staged trainer and horizon-specific evaluation. Example configurations select the transformer; reproducing a checkpoint requires its matching architecture and weights. The reported AUCs remain historical results.",
    "sourceFiles": [],
    "references": [
      [
        "Historical manuscript and aggregate results",
        "../reports/mg_manuscript_latest.html"
      ],
      [
        "Detailed training report",
        "../reports/mg_best_report.html"
      ]
    ],
    "mode": "Historical evaluation",
    "modeDetail": "Retained aggregate results, with horizon-specific denominators.",
    "reference": "Follow-up cancer outcomes",
    "referenceDetail": "Reported internal validation with horizon-specific eligibility; patients were reported as separated between training and validation.",
    "shortLimit": "Five-year AUC is excluded: that subset had only one negative exam.",
    "try": "Discrimination across the first four prediction horizons, alongside the exams eligible for each evaluation.",
    "context": "The reported cohort comprises 42,987 complete four-view examinations from 33,488 patients. This research case study presents the architecture and retained internal-validation results; the original imaging data are no longer accessible.",
    "methodsTitle": "Four views to cumulative risk",
    "materials": [
      {
        "label": "Manuscript draft",
        "url": "../reports/mg_manuscript_latest.html",
        "detail": "Historical manuscript: cohort, architecture, methods and reported results."
      },
      {
        "label": "Training report",
        "url": "../reports/mg_best_report.html",
        "detail": "Detailed model, training configuration, learning curves and evaluation plots."
      }
    ]
  },
  "tumor": {
    "name": "Interactive Breast MRI Tumor Segmentation",
    "eyebrow": "01 / Breast MRI",
    "description": "A 3D U-Net for tumor segmentation in dynamic contrast-enhanced breast MRI from the I-SPY1 dataset.",
    "image": "/figures/tumor-seg-preview-crop.png",
    "try": "Choose a case, inspect its RGB dynamics and saved prediction, then place a seed to run an interactive segmentation.",
    "methods": "Three aligned contrast phases feed a 3D U-Net. The demo combines saved whole-volume predictions with image-placed seed inference and physical measurements of the resulting masks.",
    "evidence": "The demo uses U-Net weights from the recovered joint segmentation/pCR model; it displays segmentation only. The audit reproduced historical Dice 0.7405 by averaging batch-pooled Dice on the checkpoint-selection cohort, using 1 mm resampling and image-centered validation crops. This is separate from the current segmentation-only trainer and does not measure arbitrary-seed or full-volume performance.",
    "limits": "Reference contours are Michael’s non-expert primary-tumor training annotations created in ITK-SNAP. They are not expert ground truth. Native-grid demo inference differs from the resampled training/evaluation path.",
    "code": "https://github.com/michaelzenkay/breast-mri-public",
    "codeStatus": "Public source: breast-mri-public",
    "pipeline": [
      "Three aligned MRI phases",
      "3D U-Net tumor prediction",
      "Full-volume masks and measurements",
      "Image-placed seed for live segmentation"
    ],
    "mode": "Live inference",
    "modeDetail": "The seed runs the model. The saved mask and training annotation are separate overlays.",
    "summary": "I-SPY1 contains breast MRI examinations of patients with breast cancer. This project uses pre-contrast, early post-contrast and later post-contrast images to predict the primary tumor. The viewer combines these three phases as RGB dynamics, making differences in contrast enhancement visible in color.",
    "watch": "Compare the seeded contour with the saved prediction. Move the seed to see how the inference crop changes.",
    "metric": "0.7405",
    "metricLabel": "Historical validation Dice",
    "metricNote": "Batch-pooled metric on the checkpoint-selection cohort.",
    "reference": "Non-expert training annotation",
    "referenceDetail": "An ITK-SNAP contour for comparison, not an expert-adjudicated reference.",
    "shortLimit": "Five connected cases; training annotations are not expert ground truth.",
    "stack": [
      "I-SPY1 breast MRI",
      "Three contrast phases",
      "3D U-Net"
    ],
    "references": [],
    "methodDetails": [
      {
        "title": "Inputs and display",
        "text": "Pre-contrast, early post-contrast and later post-contrast volumes are clipped, scaled and z-scored independently for the network. RGB dynamics is a color display of those phases, separate from network normalization. Quantitative uptake or washout analysis requires the original signals and verified acquisition times; it is outside this segmentation demo."
      },
      {
        "title": "Model and inference",
        "text": "A three-channel 3D U-Net produces tumor probabilities, thresholded at >0.5. Saved examples use complete volumes resampled to 1 mm in a single pass. Live inference evaluates a 96 x 96 x 96 voxel crop around the image-placed seed on the native grid. Its physical size depends on voxel spacing; tissue outside that crop is unevaluated."
      },
      {
        "title": "Mask measurements",
        "text": "Foreground voxel count and spacing give tumor volume. Physical mask coordinates define three PCA-axis extents, and the estimated surface gives sphericity. These measurements are calculated from each predicted mask and inherit its errors. The training annotation is a separate comparison overlay and does not guide inference."
      },
      {
        "title": "Current training and evaluation",
        "text": "The source provides a segmentation-only trainer using BCE plus soft Dice, Adam and cosine learning-rate decay. Inputs are resampled to 1 mm and cropped/padded at the image center; training adds flips, affine transforms and noise. Patient IDs cannot cross splits. Checkpoint selection uses mean per-case Dice; the historical demo checkpoint and its score are documented below."
      }
    ],
    "sourceFiles": [],
    "sourceNote": "The breast-mri-public contains the 3D U-Net, preprocessing, whole-volume and seed inference, mask measurements, and segmentation-only training/evaluation. It loads the demonstrated segmentation weights; its trainer does not recreate joint pCR training.",
    "context": "The demo shows five examinations with full-volume model predictions and manually drawn training labels. You can inspect the MRI in three planes, then place a seed to run a new local segmentation with the same 3D U-Net.",
    "methodsTitle": "Breast MRI segmentation"
  },
  "heart": {
    "name": "Cardiac 4D Flow MRI Analysis",
    "eyebrow": "02 / Cardiac MRI",
    "description": "Locating the aorta and measuring blood flow through the heartbeat using simulated MRI.",
    "image": "/portfolio/heart-preview.png",
    "try": "Choose a case, move through the heartbeat, and compare the predicted vessel outline, cross-sectional area and flow with the supplied reference mask.",
    "methods": "The analysis follows four steps: calculate blood velocity, segment the aorta, place measurement planes, and measure flow at each point in the heartbeat.",
    "evidence": "All 30 development series were processed; 28 passed numerical geometry checks. The portfolio contains the three highest fractions of plane-frame area errors below 10%, plus one visibly problematic example.",
    "limits": "None of the current series satisfies the strict under-10% area criterion everywhere. Examples include training data and repeated subjects. Passing geometry checks does not establish accurate flow or independent validation.",
    "code": "https://github.com/michaelzenkay/heart-public",
    "codeStatus": "Public source: heart-public",
    "pipeline": [
      "Calculate velocity from MRI phase",
      "Locate the aorta with a 3D U-Net",
      "Fit a centerline and measurement planes",
      "Measure vessel area and blood flow"
    ],
    "mode": "Saved model outputs",
    "modeDetail": "Frame and plane changes inspect frozen predictions and measurements; no retraining or inference is triggered.",
    "summary": "RACLETTE is a simulated MRI dataset for studying blood flow through the aorta, the main artery leaving the heart. Computer simulations of blood flow are combined with an MRI signal model to produce realistic images with known vessel boundaries and reference flow data.",
    "watch": "",
    "metric": "28 / 30",
    "metricLabel": "Series passing geometry checks",
    "metricNote": "Development series, including repeated subjects; this is not a flow-accuracy score.",
    "reference": "Supplied mask, same plane",
    "referenceDetail": "Both masks use the same CNN plane and phase-derived velocity, isolating mask differences.",
    "shortLimit": "",
    "stack": [],
    "references": [
      [
        "RACLETTE dataset - Dirix, Buoso and Kozerke (2026)",
        "https://doi.org/10.3929/ethz-c-000799752"
      ],
      [
        "Dataset documentation and simulation method",
        "https://github.com/rfuentes89/RACLETTE"
      ],
      [
        "Dataset license: CC BY-NC 4.0",
        "https://creativecommons.org/licenses/by-nc/4.0/"
      ]
    ],
    "methodDetails": [
      {
        "title": "1. Calculate blood velocity",
        "text": "MRI records both signal brightness (magnitude) and signal angle (phase). In velocity-encoded images, moving blood changes the phase. Comparing each encoded signal with an unencoded reference removes the common phase offset; the known encoding strength converts that difference to velocity along the encoding direction.\n\nWe combine measurements from several directions to estimate the blood's three-dimensional motion. A least-squares fit finds the three velocity components that best match those measurements."
      },
      {
        "title": "2. Segment the aorta",
        "text": "A 3D U-Net receives four inputs: the magnitude image and the three velocity maps, resampled to a 3 mm grid. It predicts the probability that each voxel belongs to the aorta; probabilities above 50% form the vessel mask. Each cardiac frame is processed separately.\n\nTraining combines voxel classification and mask-overlap losses (BCE and Dice). Related anatomies and image backgrounds stay in the same data split, and the checkpoint is selected using grouped validation Dice."
      },
      {
        "title": "3. Place measurement planes",
        "text": "Points farthest from the vessel boundary trace a route through its middle. We fit a smooth curve, or spline, along that route and place 36 planes perpendicular to it.\n\nThe planes are fitted on one frame and kept fixed through the heartbeat. Moving the plane slider selects a location along the aorta; the blue square shows that cross-section in the geometry view."
      },
      {
        "title": "4. Measure area and flow",
        "text": "Adding the physical areas of pixels inside the vessel gives its cross-sectional area in cm^2. At each pixel, we take the velocity passing through the plane, multiply by pixel area, and sum to obtain flow in mL/s. Repeating this across frames produces the curves below the images.\n\nBoth the predicted and supplied masks are measured on the same planes using the same MRI-derived velocity. Their differences therefore show how the vessel outline affects the measurements."
      }
    ],
    "sourceFiles": [],
    "sourceNote": "The heart-public contains phase decoding, the magnitude/XYZ 3D U-Net, grouped training/evaluation, centerline fitting and plane measurements. The viewer uses saved outputs from this computational pipeline.",
    "context": "The \"4D\" means three spatial dimensions followed over time through a heartbeat. Each frame contains a magnitude image showing anatomy and phase information that encodes motion. Here, a neural network locates the aorta, then we measure how much blood passes through cross-sections along it.",
    "methodsTitle": "Velocity, anatomy and flow"
  },
  "knee": {
    "name": "Knee MRI Anatomy Segmentation and Abnormality Classification",
    "eyebrow": "03 / Knee MRI",
    "description": "Study-level abnormality classification from knee MRI, with companion anatomy segmentation and ACL/MCL attachment localization.",
    "image": "knee-preview.png",
    "try": "Browse the MRI sequences and twelve finding scores, compare anatomy overlays, and jump to ACL or MCL attachments.",
    "methods": "The V4 classifier combines MRI information across slices and sequences to predict twelve findings. A separate anatomy model produces cartilage/meniscus masks and ACL/MCL attachment points. These outputs are displayed together, while the classifier receives MRI and acquisition geometry rather than anatomy-model features.",
    "evidence": "One independent example with twelve frozen V4 finding probabilities compared with report findings supplied by the user. The ACL/MCL locators were reviewed on the images. The fracture score disagrees with the supplied negative reference; this case is not an accuracy benchmark.",
    "limits": "Finding probabilities are not calibrated clinical risk. Experimental segmentation has overhang, and the model assigns fracture a score above 50% despite its negative report label.",
    "code": "https://github.com/michaelzenkay/knee-public",
    "codeStatus": "Public source: knee-public",
    "pipeline": [
      "Radiology reports to weak training labels",
      "MRI slices and sequences to study representation",
      "Twelve finding probabilities",
      "Separate cartilage, meniscus and ligament-attachment predictions"
    ],
    "mode": "Saved model outputs",
    "modeDetail": "Twelve study-level V4 probabilities accompany separately computed anatomy predictions.",
    "summary": "This project was developed using Kaggle knee MRI examinations and associated radiology reports. Findings extracted from the reports provide weak training labels for twelve abnormalities. The classifier combines information across MRI slices and sequences to produce one set of finding probabilities per examination.",
    "watch": "Scroll the sequences, toggle cartilage and meniscus outlines, then jump to predicted ACL attachments on sagittal views or MCL attachments on coronal views.",
    "metric": "12",
    "metricLabel": "Finding probabilities per study",
    "metricNote": "Twelve fixed study-level scores; six displayed sequences and 307 slices. The classifier uses the five conventional sequences; 3D DESS is shown for anatomy inspection.",
    "reference": "Report findings",
    "referenceDetail": "The supplied report summary identifies ACL/MCL abnormalities, effusion and contusion; the other eight findings are unremarkable. Ref + / - badges compare these labels with model probabilities. Reference segmentation masks and attachment coordinates are not supplied.",
    "shortLimit": "Experimental segmentation can extend beyond cartilage and menisci. The fracture prediction is a known disagreement.",
    "stack": [
      "MRI + report-derived labels",
      "12 finding outputs",
      "KneeXNet anatomy fine-tuning"
    ],
    "references": [
      [
        "KneeXNet-2.5D upstream model",
        "https://github.com/pitthexai/Knee_MRI_Segmentation_2.5D"
      ],
      [
        "DINOv2 image encoder",
        "https://github.com/facebookresearch/dinov2"
      ]
    ],
    "methodDetails": [
      {
        "title": "Data and preprocessing",
        "text": "Radiology reports supply weak finding labels for training; inference uses MRI and acquisition geometry. DICOM slices are ordered physically and intensity-transformed. An optional frozen ACL localizer anchors a crop expanded to retain the tissue envelope, with a full-field fallback. This crop localizer is separate from the companion anatomy model."
      },
      {
        "title": "Finding classification",
        "text": "DINOv2 small/14 encodes MRI slices. Finding-specific spatial queries, depth attention and sequence attention produce twelve study-level sigmoid scores. Training first fits aggregation heads, then fine-tunes the encoder using soft-label BCE and AdamW. The current trainer selects by mean development AUC across the twelve findings and reports each finding's AUC separately."
      },
      {
        "title": "Companion anatomy",
        "text": "Adjacent-slice triplets feed a KneeXNet-initialized ResNet-34 U-Net for femoral, tibial and patellar cartilage and meniscus segmentation. My femoral/tibial point annotations train custom ACL/MCL heads sharing its encoder and decoder. Each endpoint combines a predicted slice with an in-plane heatmap centroid: ACL on sagittal series, MCL on coronal series. These attachment heads are my addition to the segmentation architecture."
      },
      {
        "title": "Anatomy training and evaluation",
        "text": "Segmentation loss combines BCE and Dice only for annotated classes. Attachment losses supervise slice presence, heatmap location and endpoint separation. The source provides Dice evaluation for supervised structures and endpoint distance in physical millimetres. These are separate evaluation paths from finding AUC; the displayed personal exam is a qualitative example."
      },
      {
        "title": "Display method",
        "text": "The viewer reads fixed V4 scores and separately computed anatomy predictions. Scores above 50% are highlighted. Fine-tuned and original KneeXNet masks can be compared where available on the same sagittal slice; ACL/MCL points show predicted attachments, not explanations of the finding scores."
      }
    ],
    "sourceFiles": [],
    "sourceNote": "The knee-public contains DICOM preprocessing, the V4 classifier and frozen crop localizer, companion anatomy inference, and training/evaluation methods for classification and anatomy.",
    "context": "Companion anatomy outputs combine cartilage/meniscus segmentation fine-tuned from KneeXNet-2.5D with custom ACL/MCL attachment localization trained from my own point annotations. The demo shows the classification and anatomy outputs together on an anonymized personal examination, separate from the Kaggle examples.",
    "methodsTitle": "Finding classification and anatomy"
  }
};
