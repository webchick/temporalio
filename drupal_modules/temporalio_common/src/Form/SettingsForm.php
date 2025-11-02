<?php

namespace Drupal\temporalio_common\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

class SettingsForm extends ConfigFormBase {
  public function getFormId() { return 'temporalio_common_settings'; }
  protected function getEditableConfigNames() { return ['temporalio_common.settings']; }

  public function buildForm(array $form, FormStateInterface $form_state) {
    $cfg = $this->config('temporalio_common.settings');
    $form['temporal_url'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Temporal Web UI URL'),
      '#default_value' => $cfg->get('temporal_url') ?: 'http://localhost:8233',
      '#required' => TRUE,
      '#description' => $this->t('Base URL of the Temporal Web UI.'),
    ];
    $form['hmac_secret'] = [
      '#type' => 'textfield',
      '#title' => $this->t('HMAC shared secret'),
      '#default_value' => $cfg->get('hmac_secret') ?: '',
      '#required' => TRUE,
      '#description' => $this->t('Shared secret used to sign requests between Drupal and the Temporal runtime.'),
    ];
    return parent::buildForm($form, $form_state);
  }

  public function submitForm(array &$form, FormStateInterface $form_state) {
    parent::submitForm($form, $form_state);
    $this->configFactory->getEditable('temporalio_common.settings')
      ->set('temporal_url', $form_state->getValue('temporal_url'))
      ->set('hmac_secret', $form_state->getValue('hmac_secret'))
      ->save();
  }
}
