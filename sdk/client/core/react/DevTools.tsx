/* eslint-disable i18next/no-literal-string */
import { motion } from 'framer-motion';
import { useLayoutEffect, useState } from 'react';

import type { BlurDisplayLocation, CordSDKOptions } from '@cord-sdk/types';
import {
  CAPTURE_SCREENSHOT_EVENT,
  BLUR_DISPLAY_LOCATIONS,
  CORD_ANNOTATION_ALLOWED_DATA_ATTRIBUTE,
} from '@cord-sdk/types';
import type { CordSDK } from 'sdk/client/core/index.tsx';
import 'sdk/client/core/react/DevTools.css';

const TABS = {
  GENERAL: 'General',
  SCREENSHOTS: 'Screenshots',
};

/**
 * TODO: If someone opens Chrome Dev Tools and runs `CordSDK.enableAnnotations = true`,
 * the DevTools UI will not update. It should?
 */
export function DevTools() {
  const CordSDK = window.CordSDK as CordSDK;
  // Storing options in state to have React correctly re-render the UI.
  const [cordSDKOptions, setCordSDKOptions] = useState<CordSDKOptions>(
    () => (window.CordSDK as CordSDK).options,
  );

  const [showNonAnnotatableAreas, setShowNonAnnotatableAreas] = useState(false);
  useLayoutEffect(() => {
    const nonAnnotatableElements = document.querySelectorAll(
      `[${CORD_ANNOTATION_ALLOWED_DATA_ATTRIBUTE}="false"]`,
    );

    nonAnnotatableElements.forEach((el) =>
      showNonAnnotatableAreas
        ? el.classList.add('cord-dev-tools-blocked')
        : el.classList.remove('cord-dev-tools-blocked'),
    );
  }, [showNonAnnotatableAreas]);

  const [tabToRender, setTabToRender] = useState(TABS.GENERAL);

  const updateOption = (newOption: CordSDKOptions) => {
    void CordSDK.updateOptions({ ...newOption });
    setCordSDKOptions((prev) => ({ ...prev, ...newOption }));
  };

  return (
    <motion.div drag dragMomentum={false} whileDrag={{ scale: 1.1 }}>
      <ul>
        {Object.values(TABS).map((tab) => (
          <li
            key={tab}
            onClick={() => {
              setTabToRender(tab);
            }}
            data-tab-active={tabToRender === tab}
          >
            {tab}
          </li>
        ))}
      </ul>

      {tabToRender === TABS.GENERAL ? (
        <div className="optionsContainer">
          <label>
            <input
              id="enable_annotations"
              type="checkbox"
              defaultChecked={cordSDKOptions?.enable_annotations}
              onChange={(e) =>
                updateOption({ enable_annotations: e.target.checked })
              }
            />
            Enable Annotations
          </label>
          <label>
            <input
              type="checkbox"
              checked={showNonAnnotatableAreas}
              onChange={(e) => setShowNonAnnotatableAreas(e.target.checked)}
            />
            Show non-annotatable areas
          </label>
        </div>
      ) : tabToRender === TABS.SCREENSHOTS ? (
        <>
          <div className="optionsContainer">
            <label>
              <input
                id="blur"
                type="checkbox"
                defaultChecked={cordSDKOptions.screenshot_options?.blur}
                onChange={(e) =>
                  updateOption({
                    screenshot_options: {
                      blur: e.target.checked,
                    },
                  })
                }
              />
              Blur
            </label>
            <label>
              <input
                id="show_screenshot"
                type="checkbox"
                defaultChecked={
                  cordSDKOptions.screenshot_options?.show_screenshot
                }
                onChange={(e) =>
                  updateOption({
                    screenshot_options: {
                      show_screenshot: e.target.checked,
                    },
                  })
                }
              />
              Show screenshot
            </label>
            <label>
              Show blurred:{' '}
              <select
                name="show_blurred"
                defaultValue={cordSDKOptions.screenshot_options?.show_blurred}
                onChange={(e) =>
                  updateOption({
                    screenshot_options: {
                      show_blurred: e.target.value as BlurDisplayLocation,
                    },
                  })
                }
              >
                {BLUR_DISPLAY_LOCATIONS.map((blurLocation) => (
                  <option key={blurLocation} value={blurLocation}>
                    {blurLocation}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="multipleChoice">
            Capture when:{' '}
            {CAPTURE_SCREENSHOT_EVENT.map((captureEvt) => (
              <label key={captureEvt}>
                <input
                  id={captureEvt}
                  type="checkbox"
                  defaultChecked={cordSDKOptions.screenshot_options?.capture_when?.includes(
                    captureEvt,
                  )}
                  onChange={(e) => {
                    const captureWhen =
                      cordSDKOptions.screenshot_options?.capture_when ?? [];
                    updateOption({
                      screenshot_options: {
                        capture_when: e.target.checked
                          ? [...captureWhen, captureEvt]
                          : captureWhen.filter(
                              (currCaptureEvt) => currCaptureEvt !== captureEvt,
                            ),
                      },
                    });
                  }}
                />
                {captureEvt}
              </label>
            ))}
          </label>
        </>
      ) : null}
    </motion.div>
  );
}
