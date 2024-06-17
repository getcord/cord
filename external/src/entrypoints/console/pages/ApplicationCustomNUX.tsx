import { useCallback, useEffect, useState } from 'react';
import { Card, Form, InputGroup } from 'react-bootstrap';
import { useUpdateApplicationForConsoleMutation } from 'external/src/entrypoints/console/graphql/operations.ts';
import { createDefaultCustomNUX } from 'external/src/components/util.ts';
import { HelpIconWithTooltip } from 'external/src/entrypoints/console/components/HelpIconWithTooltip.tsx';
import { CustomButton } from 'external/src/entrypoints/console/components/CustomButton.tsx';
import { SubmitFormResultMessage } from 'external/src/entrypoints/console/components/SubmitFormResultMessage.tsx';
import { useImageField } from 'external/src/entrypoints/console/hooks/useImageField.tsx';
import { useContextThrowingIfNoProvider } from 'external/src/effects/useContextThrowingIfNoProvider.ts';
import { ConsoleApplicationContext } from 'external/src/entrypoints/console/contexts/ConsoleApplicationContextProvider.tsx';

export default function ApplicationCustomNUX() {
  const { application, refetch, id } = useContextThrowingIfNoProvider(
    ConsoleApplicationContext,
  );

  const [updateApplication] = useUpdateApplicationForConsoleMutation();

  const defaultCustomNUX = createDefaultCustomNUX(application?.name ?? '');

  const [initialOpenTitle, setInitialOpenTitle] = useState<string | null>(null);
  const [initialOpenText, setInitialOpenText] = useState<string | null>(null);
  const initialOpenImageField = useImageField({
    label: 'Image',
    tooltipContent:
      'URL or image upload. 304x152 standard image formats, including GIFs',
    imageWidth: 328,
    thumbnail: true,
    includeNoImageToggle: true,
    defaultImagePreviewUrl: defaultCustomNUX.initialOpen.imageURL,
    placeholder: (noImageToggled) =>
      noImageToggled ? 'No image will be shown' : 'Default gif will be shown',
  });

  const [welcomeTitle, setWelcomeTitle] = useState<string | null>(null);
  const [welcomeText, setWelcomeText] = useState<string | null>(null);
  const welcomeImageField = useImageField({
    label: 'Image',
    tooltipContent:
      'URL or image upload. 304x152 standard image formats, including GIFs',
    imageWidth: 328,
    thumbnail: true,
    includeNoImageToggle: true,
    defaultImagePreviewUrl: defaultCustomNUX.welcome.imageURL,
    placeholder: (noImageToggled) =>
      noImageToggled ? 'No image will be shown' : 'Default gif will be shown',
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const onSubmit = useCallback<React.FormEventHandler<HTMLFormElement>>(
    async (e) => {
      e.preventDefault();

      const [uploadedInitialOpenImageURL, uploadedWelcomeImageURL] =
        await Promise.all([
          initialOpenImageField.uploadImageFile(id!, 'nux-initial-open-image'),
          welcomeImageField.uploadImageFile(id!, 'nux-welcome-image'),
        ]);

      const result = await updateApplication({
        variables: {
          id: id!,
          customNUX: {
            initialOpen: {
              title: initialOpenTitle,
              text: initialOpenText,
              // if you active selecting 'no image' we record this as an empty string
              imageURL: initialOpenImageField.noImageToggled
                ? ''
                : uploadedInitialOpenImageURL ?? initialOpenImageField.imageURL,
            },
            welcome: {
              title: welcomeTitle,
              text: welcomeText,
              // if you active selecting 'no image' we record this as an empty string
              imageURL: welcomeImageField.noImageToggled
                ? ''
                : uploadedWelcomeImageURL ?? welcomeImageField.imageURL,
            },
          },
          customEmailTemplate: undefined,
          enableEmailNotifications: undefined,
          name: undefined,
          customLinks: undefined,
          segmentWriteKey: undefined,
          iconURL: undefined,
          redirectURI: undefined,
          eventWebhookURL: undefined,
          eventWebhookSubscriptions: undefined,
        },
      });
      if (result.data?.updateApplication.success === false) {
        setErrorMessage('An unexpected error has occurred. Please try again.');
      }
      if (!result.errors && result.data?.updateApplication.success === true) {
        setSuccessMessage('Changes saved successfully.');
        void refetch();
      }
    },
    [
      id,
      initialOpenImageField,
      initialOpenText,
      initialOpenTitle,
      refetch,
      updateApplication,
      welcomeImageField,
      welcomeText,
      welcomeTitle,
    ],
  );

  useEffect(() => {
    if (application?.customNUX) {
      const { initialOpen, welcome } = application.customNUX;
      if (initialOpen && welcome) {
        setInitialOpenTitle(initialOpen.title);
        setInitialOpenText(initialOpen.text);
        initialOpenImageField.setInitialImageURLRef.current(
          initialOpen.imageURL,
        );
        setWelcomeTitle(welcome.title);
        setWelcomeText(welcome.text);
        welcomeImageField.setInitialImageURLRef.current(welcome.imageURL);
      }
    }
  }, [
    application?.customNUX,
    initialOpenImageField.setInitialImageURLRef,
    welcomeImageField.setInitialImageURLRef,
  ]);

  return (
    <Card.Body>
      <Card.Text>
        Collaboration is a big new feature in your project, and we want to make
        sure your users notice it, get familiar with it and feel comfortable
        using it.
      </Card.Text>
      <Card.Text>
        We have a bunch of ways to let you customize onboarding users to
        collaboration using your own voice and brand.
      </Card.Text>
      <hr />
      <Form onSubmit={onSubmit}>
        <Form.Group>
          <Form.Label>Welcome to Collaboration Pop-up</Form.Label>
          <Form.Text>
            This will pop up from the Launcher button on the first open of a
            page with Cord for a user. It can be dismissed and disappears
            forever once the user opens the sidebar for the first time.
          </Form.Text>
          <InputGroup>
            <InputGroup.Prepend>
              <InputGroup.Text>
                Title
                <HelpIconWithTooltip
                  tooltipName="initial-open-title"
                  tooltipContent="Up to 48 chars"
                />
              </InputGroup.Text>
            </InputGroup.Prepend>
            <Form.Control
              type="text"
              placeholder={defaultCustomNUX.initialOpen.title}
              value={initialOpenTitle ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setInitialOpenTitle(e.target.value || null)
              }
            />
          </InputGroup>
        </Form.Group>

        <Form.Group>
          <InputGroup>
            <InputGroup.Prepend>
              <InputGroup.Text>
                Text
                <HelpIconWithTooltip
                  tooltipName="initial-open-text"
                  tooltipContent="Up to 200 chars"
                />
              </InputGroup.Text>
            </InputGroup.Prepend>
            <Form.Control
              as="textarea"
              placeholder={defaultCustomNUX.initialOpen.text}
              value={initialOpenText ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setInitialOpenText(e.target.value || null)
              }
            />
          </InputGroup>
        </Form.Group>
        {initialOpenImageField.imageFieldElement}
        {
          <>
            <Form.Group>
              <Form.Label>
                How to use collaboration - in-Sidebar experience.
              </Form.Label>
              <Form.Text>
                {`This card appears the first time a user opens the Cord sidebar on a page with comments, and it comes from your product. It explains to the user how to use Cord messages, @mention people and use annotations. It can be dismissed when the user has read it.`}
              </Form.Text>
              <InputGroup>
                <InputGroup.Text>
                  Title
                  <HelpIconWithTooltip
                    tooltipName="welcome-title"
                    tooltipContent="Up to 48 chars"
                  />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder={defaultCustomNUX.welcome.title}
                  value={welcomeTitle ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setWelcomeTitle(e.target.value || null)
                  }
                />
              </InputGroup>
            </Form.Group>

            <Form.Group>
              <InputGroup>
                <InputGroup.Text>
                  Text{' '}
                  <HelpIconWithTooltip
                    tooltipName="welcome-text"
                    tooltipContent="Up to 200 chars"
                  />
                </InputGroup.Text>
                <Form.Control
                  as="textarea"
                  placeholder={defaultCustomNUX.welcome.text}
                  value={welcomeText ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setWelcomeText(e.target.value || null)
                  }
                />
              </InputGroup>
            </Form.Group>
            {welcomeImageField.imageFieldElement}
          </>
        }
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <CustomButton type={'submit'}>Save Changes</CustomButton>
        </div>
        <SubmitFormResultMessage
          errorMessage={errorMessage}
          clearErrorMessage={() => setErrorMessage(null)}
          successMessage={successMessage}
          clearSuccessMessage={() => setSuccessMessage(null)}
          warningMessage={warningMessage}
          clearWarningMessage={() => setWarningMessage(null)}
        />
      </Form>
    </Card.Body>
  );
}
