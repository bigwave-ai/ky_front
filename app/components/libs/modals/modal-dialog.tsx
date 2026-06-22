'use client';
import { createRoot } from 'react-dom/client';
import * as Smd from '../../style/styleds/libs/modals/styled-modal-dialog';
import Draggable from 'react-draggable';
import { translate } from '@/app/services/i18n/translate';

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분  : 모든권한 - 모달
 * 03. 설명     : 대화상자 기능 제공
 * 04. 작성일자  : 2023.12.20
 * 05. 작성자   : 이희준
 */

interface ModalDialog {
  dialogTitle: string;
  dialogContent: string;
  dialogBtns: Array<any>;
  callback?: Function;
}

export default function modalDialog({ dialogTitle, dialogContent, dialogBtns, callback }: ModalDialog) {
  /******************** 변수 영역 ********************/
  const dialogRoot = createRoot(document.getElementById('modal-dialog') as Element | DocumentFragment);
  const arrBtns: Array<any> = [];
  /******************** 함수 영역 ********************/
  /******************** 수행 영역 ********************/

  dialogBtns.forEach((val, index) => {
    const dialogBtn = (
      <Smd.DialogButton
        key={index}
        autoFocus
        onClick={(e) => {
          e.preventDefault();
          if (typeof callback === 'function') {
            callback.apply(e, [val.btnId]);
          }
          dialogRoot.unmount();
        }}
      >
        {translate(val.btnNm)}
      </Smd.DialogButton>
    );
    arrBtns.push(dialogBtn);
  });

  const dialog = (
    <>
      <Smd.DialogMask>
        <Draggable>
          <Smd.DialogBox>
            <Smd.DialogHeader>{dialogTitle}</Smd.DialogHeader>
            <Smd.DialogContents>{dialogContent}</Smd.DialogContents>
            <Smd.DialogFooter>{arrBtns}</Smd.DialogFooter>
          </Smd.DialogBox>
        </Draggable>
      </Smd.DialogMask>
    </>
  );

  dialogRoot.render(dialog);
}
